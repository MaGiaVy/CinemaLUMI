import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const updates = [
  {
    id: 4,
    name: 'Combo Solo',
    image: '/combos/combo-solo.jpg',
  },
  {
    id: 5,
    name: 'Combo Đôi',
    image: '/combos/combo-doi.jpg',
  },
  {
    id: 6,
    name: 'Bắp Caramel Thượng Hạng',
    image: '/combos/bap-caramel.jpg',
  },
  {
    id: 7,
    name: 'Combo VIP Gia Đình',
    image: '/combos/combo-vip-giadinh.jpg',
  },
];

async function main() {
  console.log('--- Đang cập nhật hình ảnh Combo trong Database ---');
  for (const item of updates) {
    const updated = await prisma.combo.update({
      where: { id: item.id },
      data: { image: item.image },
    });
    console.log(`Đã cập nhật Combo ID ${updated.id} (${updated.name}) -> image: ${updated.image}`);
  }

  const allCombos = await prisma.combo.findMany({ orderBy: { id: 'asc' } });
  console.log('\n--- Danh sách Combo sau khi cập nhật ---');
  console.log(JSON.stringify(allCombos, null, 2));
}

main()
  .catch((err) => {
    console.error('Lỗi cập nhật:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
