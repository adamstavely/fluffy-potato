import bundledToolsRegistry from '../../assets/tools-registry.json';
import type { ToolDefinition } from './models/tool.model';
import { TOOL_HOST_COMPONENTS } from './tool-component.registry';

const BUNDLED_TOOLS = bundledToolsRegistry as ToolDefinition[];

describe('tool-component.registry', () => {
  it('has a host component for every tool in the bundled registry', () => {
    for (const t of BUNDLED_TOOLS) {
      expect(TOOL_HOST_COMPONENTS[t.id]).toBeTruthy();
    }
  });
});
