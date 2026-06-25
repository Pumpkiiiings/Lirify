// plugins/requeue-1-0-0.js
// Auto-Requeue Plugin for Lirify (Based on Raven B+)
// Sends /locraw on world join to track your current Hypixel mode,
// then provides a /rq command to instantly requeue to the same mode.

module.exports = (api) => {
  api.metadata({
    name: 'requeue',
    displayName: 'Auto Requeue',
    prefix: '§bRQ',
    version: '1.0.0',
    apiVersion: '^1.0.0',
    author: 'Lirify',
    description: 'Tracks your Hypixel gamemode and adds /rq to instantly play again.'
  });

  api.configSchema([
    {
      label: 'General',
      settings: [
        { key: 'enabled', type: 'toggle', description: 'Enable /rq command' }
      ],
      defaults: { enabled: true }
    }
  ]);

  let currentMode = '';
  let waitingForLocraw = false;

  // Intercept incoming chat from the server to catch the /locraw JSON response
  api.intercept('chat', (event) => {
    if (!api.config.get('enabled') || !waitingForLocraw) return;

    try {
      // The message is usually stringified JSON if it's the locraw response
      let msg = '';
      if (typeof event.data.message === 'string') {
        msg = event.data.message;
      }

      // Sometimes minecraft-protocol parses the message into a JSON object
      if (msg.startsWith('{')) {
        let parsed = JSON.parse(msg);
        
        // Hypixel usually wraps it in a text component: {"text":"{\"server\":\"...\"}","color":"white"}
        if (parsed.text && typeof parsed.text === 'string' && parsed.text.startsWith('{')) {
            try {
                parsed = JSON.parse(parsed.text);
            } catch (e) {}
        }
        
        // If it's the raw string that looks like {"server":"mini123A", "mode":"BEDWARS_EIGHT_TWO"}
        if (parsed.server && parsed.mode && parsed.mode !== 'LOBBY') {
          currentMode = parsed.mode;
          waitingForLocraw = false;
          // Hide this ugly JSON message from the player's chat
          event.cancel();
        } else if (parsed.server) {
          // It's a lobby or limbo, hide it anyway but don't save mode
          waitingForLocraw = false;
          event.cancel();
        }
      }
    } catch (e) {
      // Not a valid JSON or not the locraw message
    }
  });

  // Whenever the player switches servers/worlds on Hypixel (Respawn packet = Dimension change)
  api.on('respawn', () => {
    checkLocraw();
  });

  // Also when initially logging in
  api.on('login', () => {
    checkLocraw();
  });

  function checkLocraw() {
    if (!api.config.get('enabled')) return;
    
    // We set a flag and send /locraw after 1 second so Hypixel has time to load
    waitingForLocraw = true;
    setTimeout(() => {
      if (api.config.get('enabled')) {
        api.sendChatToServer('/locraw');
      }
    }, 1000);
  }

  // Register the client-side /rq command
  api.commands((registry) => {
    registry.command('rq')
      .description('Instantly requeue to your last played gamemode')
      .handler((ctx) => {
        if (!api.config.get('enabled')) {
          return ctx.sendError('Auto Requeue is disabled in config.');
        }

        if (!currentMode || currentMode === 'LOBBY') {
          return ctx.sendError('No active gamemode detected to requeue! Play a game first.');
        }

        ctx.sendSuccess(`Re-queueing into §d${currentMode}§a...`);
        api.sendChatToServer(`/play ${currentMode}`);
      });
  });

  return {
    disable() {
      // Cleanup if needed
      waitingForLocraw = false;
    }
  };
};
