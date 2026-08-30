# Platewise

Single-device calorie and nutrient tracker.

- Search **USDA FoodData Central** for macros and micronutrients
- Create, edit, and delete **recipes** built from those foods
- Log a daily **food diary** and track **weight** progress locally in the browser

No accounts. All diary, recipe, and weigh-in data stays in `localStorage` on this device.

## Run locally

```bash
npm install
npm run dev
```

Open [http://127.0.0.1:43147](http://127.0.0.1:43147).

### USDA API key (optional)

Platewise uses the USDA FoodData Central API. Without a key it falls back to `DEMO_KEY`, then to offline sample foods if the API is rate-limited or unreachable.

1. Request a free key at [fdc.nal.usda.gov/api-key-signup](https://fdc.nal.usda.gov/api-key-signup.html)
2. Copy `.env.example` to `.env.local`
3. Set `USDA_FDC_API_KEY=your_key`

## Scripts

| Command        | Description              |
| -------------- | ------------------------ |
| `npm run dev`  | Dev server on port 43147 |
| `npm run build`| Production build         |
| `npm run start`| Start production server  |
| `npm run lint` | ESLint                   |

## PR review (Bugbot)

Pull requests are reviewed by **Cursor Bugbot** (GitHub App), not a custom Actions workflow.

1. In [cursor.com/dashboard](https://cursor.com/dashboard) → **Integrations**, connect GitHub and grant access to this repo.
2. In **Bugbot / Automations**, enable Bugbot for this repository (auto-run on PR open/update).
3. Enable **Bugbot Autofix** → **Create New Branch** so findings can spawn a Cloud Agent that pushes fixes.

Project-specific review focus lives in [`.cursor/BUGBOT.md`](.cursor/BUGBOT.md).

**Manual triggers** on a PR comment: `cursor review` or `bugbot run` (use `bugbot run verbose=true` to debug).

Autofix uses Cloud Agent credits and requires on-demand usage plus storage-enabled privacy settings (not Legacy Privacy Mode).

