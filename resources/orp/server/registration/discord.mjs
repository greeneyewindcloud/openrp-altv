import * as alt from 'alt';
import SQL from '../../../postgres-wrapper/database.mjs';
import * as cache from '../cache/cache.mjs';
import { setupPlayerFunctions } from '../utility/player.mjs';

const db = new SQL(); // Get DB Reference

alt.on('discord:FinishLogin', (player, discordData) => {
    player.loginTimeout = undefined;
    delete player.loginTimeout;

    const account = cache.getAccount(discordData.id);
    setupPlayerFunctions(player);

    alt.log(
        `${player.name} authenticated as ${discordData.username}#${discordData.discriminator}`
    );

    if (account) {
        player.pgid = account.pgid;
        player.rank = account.rank;
        alt.emit('orp:Login', player, account.id, discordData.id);
        return;
    }

    player.rank = 0;
    db.upsertData({ userid: discordData.id }, 'Account', res => {
        player.pgid = res.id;
        cache.cacheAccount(res.userid, res.id, 0);
        alt.emit('orp:Register', player, res.id, discordData.id);
        alt.emit('orp:Login', player, res.id, discordData.id);
    });
});
