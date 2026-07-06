# Automation cron logs

Cron output ke liye local log folder (app root ke andar — `/var/log` ke liye sudo nahi chahiye).

Crontab (EC2) me endpoints ka output yahan likho:

```cron
# generate + publish chain — har 5 min (test aur production dono ke liye same)
*/5 * * * * /usr/bin/curl -s http://localhost:3000/api/cron/automation-fill-queue >> /home/ec2-user/gmb-automation/logs/fill-queue.log 2>&1
*/5 * * * * /usr/bin/curl -s http://localhost:3000/api/publish-scheduled          >> /home/ec2-user/gmb-automation/logs/publish.log 2>&1
```

Live dekhne ke liye:

```bash
tail -f /home/ec2-user/gmb-automation/logs/fill-queue.log /home/ec2-user/gmb-automation/logs/publish.log
```

- `fill-queue.log` → content generate hone ke logs (`found` / `filled` / `failed`)
- `publish.log`    → GMB/FB/IG publish hone ke logs (`posted` / `failed`)

> Note: `AUTOMATION_TEST_MODE=true` = 5 min generate / 5 min publish. `false` (ya unset) = 30 min generate / 24 h publish. Dono me crontab same `*/5` rehta hai — sirf env badal ke `pm2 restart limbuAi` karo aur dobara Save karo.

`*.log` files git me commit nahi hotin (`.gitignore`), sirf ye folder track hota hai.
