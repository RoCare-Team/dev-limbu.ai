# Automation cron logs

Cron output ke liye local log folder (app root ke andar — `/var/log` ke liye sudo nahi chahiye).

Crontab (EC2) me endpoints ka output yahan likho:

```cron
# generate + publish chain — cron har 5 min check kare (posts due hone par hi action)
*/5 * * * * /usr/bin/curl -s http://localhost:3000/api/cron/automation-fill-queue >> /home/ec2-user/gmb-automation/logs/fill-queue.log 2>&1
*/5 * * * * /usr/bin/curl -s http://localhost:3000/api/publish-scheduled          >> /home/ec2-user/gmb-automation/logs/publish.log 2>&1
```

Live dekhne ke liye:

```bash
tail -f /home/ec2-user/gmb-automation/logs/fill-queue.log /home/ec2-user/gmb-automation/logs/publish.log
```

- `fill-queue.log` → content generate hone ke logs (`found` / `filled` / `failed`)
- `publish.log`    → GMB/FB/IG publish hone ke logs (`posted` / `failed`)

> Flow: Save → +30 min generate (DB me post save) → +24 h publish → publish ke +30 min baad next generate → +24 h publish … plan ke posts / end date tak chalta rahe. Cron `*/5` sirf check karta hai; actual time DB me stored `generateContentAt`/`scheduledDate` se aata hai.

`*.log` files git me commit nahi hotin (`.gitignore`), sirf ye folder track hota hai.
