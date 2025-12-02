import { CliFileWriter, DreamCLI } from '@rvoh/dream/system'
import ts from 'typescript'
import PsychicApp from '../../psychic-app/index.js'
import ASTBuilder from './ASTBuilder.js'

const f = ts.factory

/**
 * Responsible for building dream globals, which can be found at
 * types/dream.globals.ts.
 *
 * This class leverages internal AST building mechanisms built into
 * typescript to manually build up object literals and interfaces
 * for our app to consume.
 */
export default class ASTPsychicTypesBuilder extends ASTBuilder {
  public async build() {
    const logger = DreamCLI.logger
    const sourceFile = ts.createSourceFile('', '', ts.ScriptTarget.Latest, false, ts.ScriptKind.TS)

    await logger.logProgress('[psychic] building psychic types', async () => {
      const output = await this.prettier(this.printStatements(this.buildPsychicTypes(), sourceFile))

      await CliFileWriter.write(this.psychicTypesPath(), output)
    })
  }

  /**
   * @internal
   *
   * builds up the `export const psychicTypes = ...` statement within the types/psychic.ts
   * file. It does this by leveraging low-level AST utils built into typescript
   * to manually build up an object literal, cast it as a const, and write it to
   * an exported variable.
   */
  private buildPsychicTypes() {
    const psychicApp = PsychicApp.getOrFail()
    const psychicTypesObjectLiteral = f.createObjectLiteralExpression(
      [
        f.createPropertyAssignment(
          f.createIdentifier('openapiNames'),
          f.createArrayLiteralExpression(
            Object.keys(psychicApp.openapi).map(key => f.createStringLiteral(key)),
          ),
        ),
      ],
      true, // multiline
    )

    // add "as const" to the end of the schema object we
    // have built before returning it
    const constAssertion = f.createAsExpression(
      psychicTypesObjectLiteral,
      f.createKeywordTypeNode(ts.SyntaxKind.ConstKeyword as ts.KeywordTypeSyntaxKind),
    )

    const psychicTypesObjectLiteralConst = f.createVariableStatement(
      undefined,
      f.createVariableDeclarationList(
        [
          f.createVariableDeclaration(
            f.createIdentifier('psychicTypes'),
            undefined,
            undefined,
            constAssertion,
          ),
        ],
        ts.NodeFlags.Const,
      ),
    )

    const defaultExportIdentifier = f.createIdentifier('psychicTypes')
    const exportDefaultStatement = f.createExportDefault(defaultExportIdentifier)

    return [psychicTypesObjectLiteralConst, this.newLine(), exportDefaultStatement]
  }

  /**
   * @internal
   *
   * writes the compiled statements to string.
   *
   */
  private printStatements(statements: ts.Node[], sourceFile: ts.SourceFile): string {
    const printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed, omitTrailingSemicolon: true })
    const result = printer.printList(
      ts.ListFormat.SourceFileStatements,
      f.createNodeArray(statements),
      sourceFile,
    )

    // TODO: add autogenerate disclaimer
    return `\
${result}`
  }
}
