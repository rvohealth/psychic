export default function (dreamPathType: PsychicPaths): string;
type DreamPaths = 'models' | 'modelSpecs' | 'serializers' | 'db' | 'conf' | 'factories';
export type PsychicPaths = DreamPaths | 'controllers' | 'controllerSpecs';
export {};
