import { DreamApp } from '@rvoh/dream'
import * as path from 'node:path'
import ts from 'typescript'

const f = ts.factory

/**
 * @internal
 *
 * This is a base class, which is inherited by the ASTSchemaBuilder,
 * the ASTKyselyCodegenEnhancer, and the ASTGlobalSchemaBuilder,
 * each of which is responsible for building up the output of the various
 * type files consumed by dream internally.
 *
 * This base class is just a container for common methods used by all
 * classes.
 */
export default class ASTBuilder {
  /**
   * @internal
   *
   * builds a new line, useful for injecting new lines into AST statements
   */
  protected newLine() {
    return f.createIdentifier('\n')
  }

  /**
   * @internal
   *
   * given an interface declaration, it will extrace the relevant property statement
   * by the given property name.
   */
  protected getPropertyFromInterface(
    interfaceNode: ts.InterfaceDeclaration,
    propertyName: string,
  ): ts.PropertySignature | null {
    for (const member of interfaceNode.members) {
      if (ts.isPropertySignature(member)) {
        if (ts.isIdentifier(member.name) && member.name.text === propertyName) {
          return member
        }
      }
    }

    return null
  }

  /**
   * @internal
   *
   * returns an array of string type literals which were extracted from
   * either a type or type union, depending on what is provided
   * for the typeAlias. this allows you to safely and easily collect
   * an array of types given an alias
   */
  protected extractStringLiteralTypeNodesFromTypeOrUnion(
    typeAlias: ts.TypeAliasDeclaration,
  ): // this return type is mangled a bit, so that on the other side it will be
  // easy to extract the text field from the literal without additional type checking.
  // if isStringLiteral is true, then the text field will be present, but abstracting this
  // out to a common function has caused type recognition to degrade here, forcing me to
  // be a little more direct.
  (ts.LiteralTypeNode & { literal: { text: string } })[] {
    const literals: ReturnType<ASTBuilder['extractStringLiteralTypeNodesFromTypeOrUnion']> = []

    if (ts.isUnionTypeNode(typeAlias.type)) {
      typeAlias.type.types.forEach(typeNode => {
        if (ts.isLiteralTypeNode(typeNode) && ts.isStringLiteral(typeNode.literal)) {
          literals.push(typeNode as (typeof literals)[number])
        }
      })
    } else if (ts.isLiteralTypeNode(typeAlias.type) && ts.isStringLiteral(typeAlias.type.literal)) {
      literals.push(typeAlias.type as (typeof literals)[number])
    }

    return literals
  }

  /**
   * @internal
   *
   * returns an array of type literals which were extracted from
   * either a type or type union, depending on what is provided
   * for the typeAlias. this allows you to safely and easily collect
   * an array of types given an alias
   */
  protected extractTypeNodesFromTypeOrUnion(
    typeAlias: ts.TypeAliasDeclaration | ts.PropertySignature,
  ): ts.TypeNode[] {
    const literals: ts.TypeNode[] = []

    if (typeAlias.type && ts.isUnionTypeNode(typeAlias.type)) {
      typeAlias.type.types.forEach(typeNode => {
        literals.push(typeNode)
      })
    } else if (typeAlias.type) {
      literals.push(typeAlias.type)
    }

    return literals
  }

  /**
   * @internal
   *
   * returns the provided node iff
   *   a.) the node is an exported type alias
   *   b.) the exported name matches the provided name (or else there was no name provided)
   *
   *  otherwise, returns null
   */
  protected exportedTypeAliasOrNull(node: ts.Node, exportName?: string): ts.TypeAliasDeclaration | null {
    if (
      ts.isTypeAliasDeclaration(node) &&
      node?.modifiers?.some(m => m.kind === ts.SyntaxKind.ExportKeyword) &&
      (!exportName ? true : node.name.text === exportName)
    )
      return node

    return null
  }

  /**
   * @internal
   *
   * returns the provided node iff
   *   a.) the node is an exported interface
   *   b.) the exported name matches the provided name (or else there was no name provided)
   *
   *  otherwise, returns null
   */
  protected exportedInterfaceOrNull(node: ts.Node, exportName?: string): ts.InterfaceDeclaration | null {
    if (
      ts.isInterfaceDeclaration(node) &&
      node?.modifiers?.some(m => m.kind === ts.SyntaxKind.ExportKeyword) &&
      (!exportName ? true : node.name.text === exportName)
    )
      return node

    return null
  }

  /**
   * @internal
   *
   * returns the path to the dream.globals.ts file
   */
  protected psychicTypesPath(): string {
    const dreamApp = DreamApp.getOrFail()
    return path.join(dreamApp.projectRoot, dreamApp.paths.types, 'psychic.ts')
  }

  /**
   * @internal
   *
   * safely runs prettier against the provided output. If prettier
   * is not installed, then the original output is returned
   */
  protected async prettier(output: string): Promise<string> {
    try {
      // dynamically, safely bring in prettier.
      // ini the event that it fails, we will return the
      // original output, unformatted, since prettier
      // is technically not a real dependency of dream,
      // though psychic and dream apps are provisioned
      // with prettier by default, so this should usually work
      const prettier = (await import('prettier')).default as {
        format: (str: string, opts: object) => Promise<string>
      }

      const results = await prettier.format(output, {
        parser: 'typescript',
        semi: false,
        singleQuote: true,
        tabWidth: 2,
        lineWidth: 80,
      })

      return typeof results === 'string' ? results : output
    } catch {
      // intentional noop, we don't want to raise if prettier
      // fails, since it is possible for the end user to not
      // want to use prettier, and it is not a required peer
      // dependency of dream
      return output
    }
  }

  /**
   * @internal
   *
   * given a type node, it will send back the first found generic
   * provided to that type.
   */
  protected getFirstGenericType(node: ts.Node): ts.TypeNode | null {
    if (ts.isTypeReferenceNode(node)) {
      if (node.typeArguments && node.typeArguments.length > 0) {
        return node.typeArguments[0]!
      }
    } else if (ts.isCallExpression(node)) {
      if (node.typeArguments && node.typeArguments.length > 0) {
        return node.typeArguments[0]!
      }
    }

    return null
  }
}
