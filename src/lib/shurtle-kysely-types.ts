export interface ShurtleTable {
  slug: string;
  url: string;
  hits: number;
  creatorId: string;
  createdAt: Date;
  lastHitAt: Date | null;
}

export interface ShurtleDatabase {
  Shurtle: ShurtleTable;
}
