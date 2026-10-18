# GPT Yar extension source and managed updates

The existing `v4.6.2.zip` is retained. `extension/` imports the user-supplied **4.6.5** source as the reference and adds a narrowly scoped draft **4.6.6** update-channel integration. No unrelated proxy, account, privacy, cookie or navigation code was rewritten.

The original RAR hash and API contract are documented in [the admin repository](https://github.com/gptyar-web/extensions/blob/feat/gptyar-supabase-commerce/docs/API-CONTRACTS.md).

## First managed package

After the actual Supabase project is prepared, run **Actions → Build managed extension package** and provide the public `https://<actual-project>.supabase.co/functions/v1/gptyar-api` endpoint. It builds a ZIP artifact with that channel embedded. There are no credentials in the workflow. For initial local setup:

```sh
python3 scripts/package.py --api-base YOUR_ACTUAL_FUNCTION_URL --output gptyar-4.6.6.zip
node --test tests/*.test.mjs
```

Only the public release check is routed to Supabase; it sends the current manifest version and no token/device ID. Other requests still use the main GPT Yar API. Without a configured channel the source preserves upstream update behavior. Future packages must retain this managed channel; uploading an unrelated vendor package cannot automatically change the vendor's server.

The ZIP can be validated/uploaded/published from the admin panel. Chrome installation remains manual, and an existing 4.6.5 installation cannot be remotely moved to the new endpoint. A forced update disables functionality in this client and displays the download link; it does not install a package or bypass Chrome protections.

**Not released or live-tested:** the upstream API's acceptance of manifest version 4.6.6 must be verified with authorized credentials before distribution. No real token creation, renewal or automatic Chrome installation is claimed.
