import mongoose from 'mongoose';
import { env } from '../config/env';
import { MasterInstrumentModel } from '../modules/instrument/instrument.model';
import { TestTypeModel } from '../modules/test-type/test-type.model';

const INSTRUMENT_TEST_MAP: Record<string, string[]> = {
  Anemometer: ['AIR_VELOCITY_ACPH_PAO'],
  'Aerosol Photometer': ['AIR_VELOCITY_ACPH_PAO'],
  'Particle Counter': ['PARTICLE_COUNT'],
  'Data Logger': [],
  'Relative Humidity Meter': [],
};

async function seed() {
  await mongoose.connect(env.mongodbUri, { dbName: env.mongodbDb });
  console.log('Connected to MongoDB');

  const testTypes = await TestTypeModel.find({});
  const codeToId: Record<string, mongoose.Types.ObjectId> = {};
  testTypes.forEach((tt) => { codeToId[tt.code] = tt._id as mongoose.Types.ObjectId; });

  const instruments = await MasterInstrumentModel.find({});
  for (const inst of instruments) {
    const matchedName = Object.keys(INSTRUMENT_TEST_MAP).find((key) =>
      inst.name.toLowerCase().includes(key.toLowerCase()),
    );
    if (!matchedName) continue;

    const testTypeCodes = INSTRUMENT_TEST_MAP[matchedName];
    const ids = testTypeCodes.map((code) => codeToId[code]).filter(Boolean);

    if (ids.length) {
      await MasterInstrumentModel.findByIdAndUpdate(inst._id, { availableTestTypeIds: ids });
      console.log(`Linked ${inst.name} → ${testTypeCodes.join(', ')}`);
    }
  }

  console.log('Instrument test type linking complete');
  await mongoose.disconnect();
}

seed().catch((err) => { console.error(err); process.exit(1); });
