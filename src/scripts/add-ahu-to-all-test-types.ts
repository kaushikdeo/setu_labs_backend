import mongoose from 'mongoose';
import { TestTypeModel } from '../modules/test-type/test-type.model';
import { env } from '../config/env';

async function run() {
  await mongoose.connect(env.mongodbUri, { dbName: env.mongodbDb });
  console.log('Connected to MongoDB');

  const all = await TestTypeModel.find({});
  let patched = 0;

  for (const tt of all) {
    const fields: any[] = tt.headerFields ?? [];
    if (fields.some((f: any) => f.key === 'ahuNumber')) {
      console.log(`  SKIP (already has ahuNumber): ${tt.name}`);
      continue;
    }

    const insertAfter = (key: string) => {
      const idx = fields.findIndex((f: any) => f.key === key);
      return idx !== -1 ? idx + 1 : fields.length;
    };

    const ahuField = { key: 'ahuNumber', label: 'AHU No.', type: 'text', required: false };

    let pos: number;
    if (fields.some((f: any) => f.key === 'numberOfFilters')) {
      pos = insertAfter('numberOfFilters');
    } else if (fields.some((f: any) => f.key === 'departmentArea')) {
      pos = insertAfter('departmentArea');
    } else {
      pos = fields.length;
    }

    fields.splice(pos, 0, ahuField);

    await TestTypeModel.findByIdAndUpdate(tt._id, { $set: { headerFields: fields } });
    console.log(`  PATCHED: ${tt.name}`);
    patched++;
  }

  console.log(`\nDone. ${patched} test type(s) updated.`);
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
