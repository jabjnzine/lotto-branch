# Lotto Back Office

ระบบหลังบ้านสำหรับจัดการรับแทงหวยไทยและลาว รองรับโครงสร้าง 3 ชั้น: Admin → เจ้า → บ้าน

## Language

### โครงสร้างผู้ใช้

**Admin**:
ผู้ดูแลระบบสูงสุด กำหนด Commission Rate ของเจ้า และจัดการ config ระดับระบบ
_Avoid_: superadmin, owner, system

**เจ้า (Agent)**:
ผู้ดูแลระดับกลาง มีคนเดียวในระบบ (UserRole.AGENT) รับ Commission จากส่วนต่างระหว่าง Agent Rate และ House Rate
_Avoid_: master, เจ้ามือ, ตัวแทน

**บ้าน (House)**:
หน่วยรับแทงจากลูกค้า มีได้หลายหลัง แต่ละหลังมี Commission Rate ของตัวเอง ตั้งโดยเจ้า ต้องไม่เกิน Agent Rate
_Avoid_: agent, สาขา, โต๊ด

**ลูกค้า (Buyer)**:
ผู้แทงหวย ไม่มี account ในระบบ บันทึกแค่ชื่อใน bet
_Avoid_: user, customer, member

### Commission

**Commission Rate**:
อัตราค่าคอมมิชชั่นในรูป % ของยอดรับ (ไม่ใช่ส่วนลด payout rate และไม่ใช่การแบ่งกำไร)
มี 2 ระดับ: Agent Rate (กำหนดโดย Admin) และ House Rate (กำหนดโดยเจ้า ต้องไม่เกิน Agent Rate)
_Avoid_: ส่วนลด, discount, rebate, fee

**Agent Commission**:
คอมที่เจ้าได้รับ = ยอดรับ × (Agent Rate − House Rate)
คำนวณและบันทึกเป็น snapshot ณ เวลารับแทง
_Avoid_: เจ้าคอม, master commission

**House Commission**:
คอมที่บ้านได้รับ = ยอดรับ × House Rate
คำนวณและบันทึกเป็น snapshot ณ เวลารับแทง
_Avoid_: บ้านคอม, agent fee

**Net Amount**:
ยอดที่ระบบ (Admin) ได้รับหลังหักคอมทุกชั้น = ยอดรับ − House Commission − Agent Commission
_Avoid_: profit (profit คือ net amount หักยอดจ่ายรางวัลอีกที), กำไร

### การรับแทง

**Bet**:
ใบแทงหนึ่งใบ ประกอบด้วยหลาย BetItem ผูกกับ Round และ House ผ่าน user_id → house_id
_Avoid_: order, slip, ticket

**BetItem**:
รายการแทงหนึ่งบรรทัด เก็บ commission_amount (House Commission) และ agent_commission_amount (Agent Commission) เป็น snapshot ณ เวลาแทง เพื่อ historical accuracy
_Avoid_: bet line, แทง

**Round**:
งวดหวย ผูกกับ LotteryType และมีวันออกผล
_Avoid_: งวด (ใช้ได้ในภาษาพูด แต่ใน code ใช้ Round)
