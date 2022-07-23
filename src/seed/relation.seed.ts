import { createRelationsByGroup } from "src/helpers/relations.helper";

export const seedRelations = async () => {
  for (let i = 0; i < 20; i++) {
    const groupNo = i * 5;
    const group = [
      groupNo + 1,
      groupNo + 2,
      groupNo + 3,
      groupNo + 4,
      groupNo + 5,
    ];
    await createRelationsByGroup({ projectIds: group });
  }
};
