import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { withApiHandler } from '@/app/utils/apiErrorHandling';

export const dynamic = 'force-dynamic';

export const GET = withApiHandler('GET /api/claude-terminal/mcp-health', async (_request: NextRequest) => {
    const mcpPath = path.join(process.cwd(), '.mcp.json');
    let mcpConfigStr;
    try {
      mcpConfigStr = await fs.readFile(mcpPath, 'utf-8');
    } catch (err) {
      return NextResponse.json({
        status: 'error',
        message: '.mcp.json not found'
      }, { status: 404 });
    }

    const mcpConfig = JSON.parse(mcpConfigStr);
    const storyServer = mcpConfig.mcpServers?.story;

    if (!storyServer || !storyServer.env) {
      return NextResponse.json({
        status: 'error',
        message: 'Story server or env not configured in .mcp.json'
      }, { status: 400 });
    }

    const baseUrl = storyServer.env.STORY_BASE_URL;
    const projectId = storyServer.env.STORY_PROJECT_ID;

    if (!baseUrl || !projectId) {
      return NextResponse.json({
        status: 'error',
        message: 'Missing STORY_BASE_URL or STORY_PROJECT_ID in .mcp.json',
        baseUrl,
        projectId
      }, { status: 400 });
    }

    // Ping the lightweight endpoint or the base URL itself
    // We'll hit the /api/projects endpoint to see if the server responds
    const response = await fetch(`${baseUrl}/api/projects`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      // timeout short so it fails fast
      signal: AbortSignal.timeout(5000)
    });

    if (response.ok) {
      return NextResponse.json({
        status: 'connected',
        baseUrl,
        projectId
      });
    } else {
      return NextResponse.json({
        status: 'unreachable',
        message: `HTTP ${response.status}`,
        baseUrl,
        projectId
      });
    }
});
