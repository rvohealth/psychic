import request from 'supertest';
import { PsychicServer } from '../src';
type AgentOptions = Parameters<typeof request.agent>[1];
export default function supersession(server: PsychicServer, config?: AgentOptions): ReturnType<typeof request>;
export {};
