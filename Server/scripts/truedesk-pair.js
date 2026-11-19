#!/usr/bin/env node
// Pairs this website with Truedesk Cloud, once.
//
//   node scripts/truedesk-pair.js <PAIRING-CODE> [--url https://cloud.truedesk.co.uk]
//
// The pairing code comes from the cloud (`npm run cli -- pair --slug <shop>` in truedesk-cloud),
// works once and expires after 24 h. This prints the device token ONCE: put it into Coolify
// (MCCL-BACKEND) as TRUEDESK_TOKEN, with TRUEDESK_URL and TRUEDESK_ENABLED=true, and redeploy.
// The token is not saved anywhere by this script.

const { activate } = require('../services/truedesk/client');

const args = process.argv.slice(2);
const code = args.find((a) => !a.startsWith('--'));
const urlArg = args.indexOf('--url');
const url = (urlArg >= 0 ? args[urlArg + 1] : process.env.TRUEDESK_URL) || 'https://cloud.truedesk.co.uk';

if (!code) {
  console.error('Usage: node scripts/truedesk-pair.js <PAIRING-CODE> [--url https://cloud.truedesk.co.uk]');
  process.exit(2);
}

(async () => {
  try {
    const res = await activate(url, {
      pairing_code: code.trim().toUpperCase(),
      device_name: 'mccullochjewellers.co.uk',
      user_name: 'Website',
      device_kind: 'website',
    });
    if (!res || !res.token || res.device_kind !== 'website') {
      console.error('Pairing answered without a website token. Nothing to set.');
      process.exit(1);
    }
    console.log(`Paired with ${res.tenant ? res.tenant.name || res.tenant.slug : 'the shop'} as device ${res.device_code} (website).`);
    console.log('');
    console.log('Set these on MCCL-BACKEND in Coolify, then redeploy:');
    console.log(`  TRUEDESK_URL=${url.replace(/\/+$/, '')}`);
    console.log(`  TRUEDESK_TOKEN=${res.token}`);
    console.log('  TRUEDESK_ENABLED=true');
    console.log('  TRUEDESK_STAFF_SENDER_ID=<id of the "Truedesk App" admin user>');
    console.log('');
    console.log('This token is shown once. Keep it secret: it lets its holder read and write the shop chats.');
  } catch (err) {
    console.error(`Pairing failed: ${err.message}`);
    process.exit(1);
  }
})();
