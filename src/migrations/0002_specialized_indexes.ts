export = {
    down(): Promise<void> {
      return Promise.resolve();
    },
    up(): Promise<any> {
      // empty migration
      // everything is done in 0001_init_models.ts
      // this migration has already been played in qual/prod
      return Promise.resolve();
    }
  }