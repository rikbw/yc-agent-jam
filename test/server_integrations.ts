import { Metorial } from 'metorial';
import { metorialOpenAI } from '@metorial/openai';
import OpenAI from 'openai';

const metorial = new Metorial({
  apiKey: ''
});

const openai = new OpenAI({
  apiKey: ''
})

async function main() {
  console.log('Starting Metorial MCP integration test...\n');

  // Step 1: Create OAuth sessions for both GitHub and Google Calendar
  console.log('📝 Creating OAuth sessions for GitHub and Google Calendar...');
  const [githubOAuthSession, calendarOAuthSession] = await Promise.all([
    metorial.oauth.sessions.create({
      serverDeploymentId: '' // GitHub server
    }),
    metorial.oauth.sessions.create({
      serverDeploymentId: '' // Google Calendar server
    })
  ]);

  // Step 2: Display OAuth URLs for user authentication
  console.log('\n🔐 OAuth Authentication Required:');
  console.log('Please visit these URLs to authenticate:');
  console.log(`\n   GitHub:          ${githubOAuthSession.url}`);
  console.log(`   Google Calendar: ${calendarOAuthSession.url}\n`);
  console.log('Waiting for you to complete both OAuth flows...');

  // Step 3: Wait for user to complete both OAuth flows
  await metorial.oauth.waitForCompletion([githubOAuthSession, calendarOAuthSession]);
  console.log('✅ Both OAuth authentications completed!\n');

  // Step 3.5: Test each deployment individually to find which is inactive
  console.log('🔍 Testing GitHub deployment...');
  try {
    await metorial.withProviderSession(
      metorialOpenAI.chatCompletions,
      {
        serverDeployments: [
          {
            serverDeploymentId: '',
            oauthSessionId: githubOAuthSession.id
          }
        ]
      },
      async (session) => {
        console.log('✅ GitHub deployment is ACTIVE');
        console.log(`   Tools available: ${session.tools.length}`);
      }
    );
  } catch (error: any) {
    console.log('❌ GitHub deployment is INACTIVE');
    console.log(`   Error: ${error.message}`);
  }

  console.log('\n🔍 Testing Calendar deployment...');
  try {
    await metorial.withProviderSession(
      metorialOpenAI.chatCompletions,
      {
        serverDeployments: [
          {
            serverDeploymentId: 'svd_0mhhsr2x21jx2qSclT8PRh',
            oauthSessionId: calendarOAuthSession.id
          }
        ]
      },
      async (session) => {
        console.log('✅ Calendar deployment is ACTIVE');
        console.log(`   Tools available: ${session.tools.length}`);
      }
    );
  } catch (error: any) {
    console.log('❌ Calendar deployment is INACTIVE');
    console.log(`   Error: ${error.message}`);
  }

  console.log('\n' + '='.repeat(60));
  console.log('Starting full integration test with both deployments...\n');

  // Step 4: Use both authenticated sessions with OpenAI
  await metorial.withProviderSession(
    metorialOpenAI.chatCompletions,
    {
      serverDeployments: [
        {
          serverDeploymentId: '',
          oauthSessionId: githubOAuthSession.id
        },
        {
          serverDeploymentId: '',
          oauthSessionId: calendarOAuthSession.id
        }
      ]
    },
    async (session) => {
      // Initialize conversation with a task that uses both services
      const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
        {
          role: 'user',
          content: 'First, tell me what repositories I have access to on GitHub. Then, show me my calendar events for the next 7 days.'
        }
      ];

      console.log('Available tools:', session.tools.length);
      console.log('Tool names:', session.tools.map((t: any) => t.function?.name || 'unknown').join(', '), '\n');

      // Conversation loop (max 10 iterations)
      for (let i = 0; i < 10; i++) {
        console.log(`\n--- Iteration ${i + 1} ---`);

        // Call OpenAI with Metorial tools
        const response = await openai.chat.completions.create({
          model: 'gpt-4o',
          messages,
          tools: session.tools
        });

        const choice = response.choices[0]!;
        const toolCalls = choice.message.tool_calls;

        // If no tool calls, we're done
        if (!toolCalls) {
          console.log('\n✅ Final Response:');
          console.log(choice.message.content);
          return;
        }

        // Log tool calls
        console.log(`\n🔧 Tool calls: ${toolCalls.length}`);
        toolCalls.forEach((call, idx) => {
          const name = (call as any).function?.name || 'unknown';
          console.log(`  ${idx + 1}. ${name}`);
        });

        // Execute tools through Metorial
        const toolResponses = await session.callTools(toolCalls as any);

        console.log(`✓ Tool responses received: ${toolResponses.length}`);

        // Add to conversation
        messages.push(
          {
            role: 'assistant',
            tool_calls: choice.message.tool_calls
          } as any,
          ...toolResponses
        );
      }

      console.log('\n⚠️  Reached maximum iterations (10)');
    }
  );

  console.log('\n✅ Test completed successfully!');
}

main().catch((error) => {
  console.error('\n❌ Error:', error.message);
  console.error(error);
  process.exit(1);
});