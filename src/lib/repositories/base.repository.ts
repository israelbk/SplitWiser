/**
 * Base repository with common CRUD operations
 * Provides a consistent interface for data access
 */

import { supabase } from '@/lib/supabase';
import type { SupabaseClient } from '@supabase/supabase-js';

export interface QueryOptions {
  limit?: number;
  offset?: number;
  orderBy?: {
    column: string;
    ascending?: boolean;
  };
}

export abstract class BaseRepository<TRow, TDomain, TCreate, TUpdate> {
  protected client: SupabaseClient;
  protected tableName: string;
  protected abstract fromRow(row: TRow): TDomain;

  constructor(tableName: string, client: SupabaseClient = supabase) {
    this.tableName = tableName;
    this.client = client;
  }

  /**
   * Get all records with optional filtering
   */
  async findAll(options?: QueryOptions): Promise<TDomain[]> {
    let query = this.client.from(this.tableName).select('*');

    if (options?.orderBy) {
      query = query.order(options.orderBy.column, {
        ascending: options.orderBy.ascending ?? true,
      });
    }

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    if (options?.offset) {
      query = query.range(options.offset, options.offset + (options.limit ?? 10) - 1);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch from ${this.tableName}: ${error.message}`);
    }

    return (data as TRow[]).map((row) => this.fromRow(row));
  }

  /**
   * Get a single record by ID
   */
  async findById(id: string): Promise<TDomain | null> {
    const { data, error } = await this.client
      .from(this.tableName)
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Not found
      }
      throw new Error(`Failed to fetch ${this.tableName} by id: ${error.message}`);
    }

    return this.fromRow(data as TRow);
  }

  /**
   * Create a new record
   */
  async create(input: TCreate): Promise<TDomain> {
    const { data, error } = await this.client
      .from(this.tableName)
      .insert(input as Record<string, unknown>)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create ${this.tableName}: ${error.message}`);
    }

    return this.fromRow(data as TRow);
  }

  /**
   * Update an existing record
   */
  async update(id: string, input: TUpdate): Promise<TDomain> {
    const { data, error } = await this.client
      .from(this.tableName)
      .update(input as Record<string, unknown>)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update ${this.tableName}: ${error.message}`);
    }

    return this.fromRow(data as TRow);
  }

  /**
   * Delete a record by ID
   */
  async delete(id: string): Promise<void> {
    const { error } = await this.client
      .from(this.tableName)
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete ${this.tableName}: ${error.message}`);
    }
  }

  /**
   * Find records by a specific column value
   */
  async findBy(column: string, value: unknown, options?: QueryOptions): Promise<TDomain[]> {
    let query = this.client.from(this.tableName).select('*').eq(column, value);

    if (options?.orderBy) {
      query = query.order(options.orderBy.column, {
        ascending: options.orderBy.ascending ?? true,
      });
    }

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch from ${this.tableName}: ${error.message}`);
    }

    return (data as TRow[]).map((row) => this.fromRow(row));
  }
}

