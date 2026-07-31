# VigilEye - YouTube Demo Video Script (Shot-by-Shot)

Shot-by-shot demo script covering every feature end to end. Full details in the sections below.

## Pre-requisites

| App | URL |
|---|---|
| Landing | https://vigileye-landing.vercel.app |
| Driver login | https://vigileye-driver.vercel.app/login |
| Driver register | https://vigileye-driver.vercel.app/register |
| Admin | https://vigileye-admin.vercel.app/admin/login |
| ML API | https://vigiley-ml.onrender.com |
| Repo | https://github.com/Shaanworkspace/vigiley |

Credentials:
- Admin: admin@example.com / admin123
- Driver 1: utkarsh@example.com / driver123
- Driver 2: shreya@example.com / driver123
- Driver 3: shaan@example.com / driver123

Use two browser windows side by side: driver on left, admin on right.
Use a normal profile for driver and an incognito window for admin so they do not log each other out.

## Scene by scene

1. Hook - split screen, driver camera + admin dashboard.
2. Landing page - scroll top to bottom, explain the three parts.
3. Driver login - type shreya@example.com / driver123, click Sign in.
4. Registration - click Create account link, fill name/email/password/phone/Aadhaar/DL/vehicle, submit.
5. Start monitoring - click Start Monitoring, camera goes LIVE, numbers update every second.
6. Normal state - eyes open, mouth closed, status stays awake.
7. Yawn detection - open mouth wide twice, MAR rises, warning appears then clears on its own.
8. Eye-close countdown cancel - close eyes 3-4 seconds, countdown 5-4-3 appears, open eyes, it cancels.
9. Full escalation - close eyes and do not respond. Countdown 5s -> Accept screen 5s -> alarm rings 10s -> switch to admin window, full-screen alert appears.
10. Admin dashboard - acknowledge and dismiss, show fleet stats.
11. Admin drivers + alerts pages - show driver list, vehicle, SDS, alert log.
12. Driver accept - press ACCEPT to stop the alarm.
13. Reports - show session duration, alerts, risk.
14. Tech stack - show repo structure.
15. Outro.

## Do NOT press

- Stop Monitoring mid-demo
- Accept during the escalation scene
- Reject on admin toast (feature removed by design)
- Refresh the browser mid-scene
- Close eyes longer than 4s in the cancel scene

## Plagiarism note

Posting the demo is safe - it is your own project, so it is not plagiarism. A public timestamped demo proves you built it first. Keep the paper's technical details (methodology, equations, datasets, results) out of the video. Cite the demo as your own prior work in the paper.
