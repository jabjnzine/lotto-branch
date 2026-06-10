# บันทึก Commission เป็น Snapshot ใน BetItem

เก็บ `commission_amount` และ `agent_commission_amount` ลงใน `bet_items` ณ เวลารับแทง แทนการคำนวณ on-the-fly จาก rate ปัจจุบัน เพื่อให้รายงานย้อนหลังถูกต้องแม้ว่า commission rate จะถูกแก้ไขในภายหลัง

## Considered Options

- **On-the-fly calculation** — ง่ายกว่า ไม่ต้องเพิ่ม column แต่เปลี่ยน rate แล้วตัวเลขเก่าเปลี่ยนตาม ไม่ suitable สำหรับระบบการเงิน
- **Snapshot (chosen)** — เพิ่ม 2 columns ใน bet_items แต่ historical accuracy ถูกต้องเสมอ
