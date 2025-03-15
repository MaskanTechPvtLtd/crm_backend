// jest/setupFilesAfterEnv.mjs
import serializer from './snapshot-serializer.mjs';

// Register the snapshot serializer with Jest
expect.addSnapshotSerializer(serializer);
