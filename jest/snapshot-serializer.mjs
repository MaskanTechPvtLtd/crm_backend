// // jest/snapshot-serializer.js
// export default {
//     test(val) {
//       return val && typeof val === 'string' && val.startsWith('CustomSerializer');
//     },
//     print(val) {
//       return `CustomSerialized: ${val}`;
//     }
//   };

// jest/snapshot-serializer.js
export default {
  test(val) {
    return val && typeof val === "string" && val.startsWith("CustomSerializer");
  },
  print(val) {
    return `CustomSerialized: ${val}`;
  },
};
