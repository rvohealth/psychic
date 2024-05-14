"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class ViteConfBuilder {
    static build(userOptions) {
        const frameworkName = clientFrameworkName(userOptions);
        return `
import { defineConfig } from 'vite'
import ${frameworkName} from '@vitejs/plugin-${frameworkName}'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [${frameworkName}()],
  server: {
    port: 3000,
  },
})
`;
    }
}
exports.default = ViteConfBuilder;
function clientFrameworkName(userOptions) {
    switch (userOptions.client) {
        case 'react':
            return 'react';
        case 'vue':
        case 'nuxt':
            return 'vue';
        default:
            throw new Error(`unrecognized client type when determining framework name: ${userOptions.client}`);
    }
}
