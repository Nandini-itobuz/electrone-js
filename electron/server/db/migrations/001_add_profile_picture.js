export const up = (db) => {
  db.exec("ALTER TABLE users ADD COLUMN profile_picture TEXT");
};

export const down = () => {
  console.warn("Downgrade not supported for this migrations");
};

export const version = 1;
export const name = "add_profile_picture";
