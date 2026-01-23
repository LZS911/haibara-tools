import type Database from 'better-sqlite3';
import { getDatabase } from '../database';

/**
 * 基础 Repository 类
 * 提供数据库访问和事务支持
 */
export abstract class BaseRepository {
  /**
   * 获取数据库实例
   */
  protected get db(): Database.Database {
    return getDatabase();
  }

  /**
   * 在事务中执行操作
   * @param fn 要执行的函数
   * @returns 函数返回值
   */
  protected runInTransaction<T>(fn: () => T): T {
    const db = this.db;
    return db.transaction(fn)();
  }

  /**
   * 执行批量插入或更新
   * @param items 要处理的项目
   * @param handler 处理每个项目的函数
   */
  protected batchExecute<T>(items: T[], handler: (item: T) => void): void {
    this.runInTransaction(() => {
      for (const item of items) {
        handler(item);
      }
    });
  }
}
