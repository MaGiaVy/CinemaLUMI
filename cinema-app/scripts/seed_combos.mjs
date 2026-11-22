import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const COMBOS_TO_SEED = [
  {
    name: 'Combo Solo',
    description: '1 Bắp rang bơ lớn (vị ngọt/mặn) + 1 Nước ngọt lớn (Pepsi/7UP/Mirinda)',
    price: 89000,
    image: '/combos/combo-solo.jpg',
    stock: 100,
    status: 'ACTIVE',
  },
  {
    name: 'Combo Đôi',
    description: '1 Bắp rang bơ khổng lồ + 2 Nước ngọt vừa mát lạnh',
    price: 119000,
    image: '/combos/combo-doi.jpg',
    stock: 100,
    status: 'ACTIVE',
  },
  {
    name: 'Bắp Caramel Thượng Hạng',
    description: 'Bắp rang phủ xốt caramel hảo hạng, thơm nức giòn rụm',
    price: 69000,
    image: '/combos/bap-caramel.jpg',
    stock: 80,
    status: 'ACTIVE',
  },
  {
    name: 'Combo VIP Gia Đình',
    description: '2 Bắp rang lớn + 2 Nước ngọt lớn + 1 Snack/Hotdog phô mai',
    price: 189000,
    image: '/combos/combo-vip-giadinh.jpg',
    stock: 50,
    status: 'ACTIVE',
  },
  {
    name: 'Nước Ngọt Pepsi Lớn',
    description: 'Ly lớn 32oz có đá mát lạnh, giải khát cực đã',
    price: 35000,
    image: '/combos/combo-solo.jpg',
    stock: 200,
    status: 'ACTIVE',
  },
  {
    name: 'Nước Ngọt 7UP Lớn',
    description: 'Ly lớn 32oz vị chanh sảng khoái mát lạnh',
    price: 35000,
    image: '/combos/combo-solo.jpg',
    stock: 200,
    status: 'ACTIVE',
  },
  {
    name: 'Nước Khoáng Aquafina 500ml',
    description: 'Nước uống tinh khiết đóng chai 500ml ướp lạnh',
    price: 20000,
    image: '/combos/combo-solo.jpg',
    stock: 200,
    status: 'ACTIVE',
  },
];

async function main() {
  console.log('Seeding combos and drinks into PostgreSQL database...');
  for (const item of COMBOS_TO_SEED) {
    const existing = await prisma.combo.findFirst({
      where: { name: item.name },
    });
    if (!existing) {
      const created = await prisma.combo.create({
        data: item,
      });
      console.log(`+ Đã tạo: ${created.name} (${Number(created.price).toLocaleString('vi-VN')} đ)`);
    } else {
      const updated = await prisma.combo.update({
        where: { id: existing.id },
        data: {
          description: item.description,
          price: item.price,
          image: item.image,
          stock: item.stock,
          status: item.status,
        },
      });
      console.log(`* Đã cập nhật: ${updated.name}`);
    }
  }
  const count = await prisma.combo.count();
  console.log(`\nHoàn tất! Tổng cộng hiện có ${count} combo/thức uống trong Database.`);
}

main()
  .catch((err) => {
    console.error('Lỗi khi seed combo:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
