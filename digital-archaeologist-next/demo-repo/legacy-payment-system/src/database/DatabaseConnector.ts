/**
 * Singleton database connector mock simulating legacy monolithic raw queries
 */
export class DatabaseConnector {
  private static instance: DatabaseConnector | null = null;
  private connected: boolean = false;
  private poolSize: number = 20;

  private constructor() {
    this.connected = true;
  }

  public static getInstance(): DatabaseConnector {
    if (!DatabaseConnector.instance) {
      DatabaseConnector.instance = new DatabaseConnector();
    }
    return DatabaseConnector.instance;
  }

  public query(sql: string, params: any[] = []): any[] {
    if (!this.connected) {
      throw new Error("Database not connected");
    }
    // Simulation of query return
    return [{ id: "mock_row_1", affected: 1 }];
  }

  public getStatus(): { connected: boolean; poolSize: number } {
    return {
      connected: this.connected,
      poolSize: this.poolSize
    };
  }
}
