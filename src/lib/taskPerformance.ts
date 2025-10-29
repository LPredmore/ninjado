import { supabase } from '@/integrations/supabase/client';

export interface TaskPerformanceMetric {
  id: string;
  task_id: string;
  user_id: string;
  total_executions: number;
  average_time_variance: number;
  created_at: string;
  updated_at: string;
}

/**
 * Update task performance metrics after task completion
 * @param taskId - The ID of the completed task
 * @param userId - The ID of the user
 * @param timeVariance - Time saved (positive) or lost (negative) in seconds
 */
export async function updateTaskPerformanceMetrics(
  taskId: string,
  userId: string,
  timeVariance: number
): Promise<void> {
  try {
    // 1. Fetch existing metrics
    const { data: existingMetric, error: fetchError } = await supabase
      .from('task_performance_metrics')
      .select('*')
      .eq('task_id', taskId)
      .eq('user_id', userId)
      .maybeSingle();

    if (fetchError) throw fetchError;

    if (existingMetric) {
      // 2. Calculate new average using running average formula
      const oldAverage = existingMetric.average_time_variance;
      const oldCount = existingMetric.total_executions;
      const newAverage = Math.round(
        ((oldAverage * oldCount) + timeVariance) / (oldCount + 1)
      );
      const newCount = oldCount + 1;

      // 3. Update existing record
      const { error: updateError } = await supabase
        .from('task_performance_metrics')
        .update({
          total_executions: newCount,
          average_time_variance: newAverage,
        })
        .eq('id', existingMetric.id);

      if (updateError) throw updateError;
    } else {
      // 4. Create new record (first execution)
      const { error: insertError } = await supabase
        .from('task_performance_metrics')
        .insert({
          task_id: taskId,
          user_id: userId,
          total_executions: 1,
          average_time_variance: Math.round(timeVariance),
        });

      if (insertError) throw insertError;
    }

    console.log(`✅ Task performance updated: taskId=${taskId}, variance=${timeVariance}s`);
  } catch (error) {
    console.error('Error updating task performance metrics:', error);
    // Don't throw - we don't want to block task completion if metrics fail
  }
}

/**
 * Reset task performance metrics to zero
 * @param taskId - The ID of the task to reset
 * @param userId - The ID of the user
 */
export async function resetTaskPerformanceMetrics(
  taskId: string,
  userId: string
): Promise<void> {
  try {
    const { error } = await supabase
      .from('task_performance_metrics')
      .update({
        total_executions: 0,
        average_time_variance: 0,
      })
      .eq('task_id', taskId)
      .eq('user_id', userId);

    if (error) throw error;
    console.log(`✅ Task performance reset: taskId=${taskId}`);
  } catch (error) {
    console.error('Error resetting task performance metrics:', error);
    throw error;
  }
}

/**
 * Get performance metrics for a specific task
 */
export async function getTaskPerformanceMetric(
  taskId: string,
  userId: string
): Promise<TaskPerformanceMetric | null> {
  const { data, error } = await supabase
    .from('task_performance_metrics')
    .select('*')
    .eq('task_id', taskId)
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    console.error('Error fetching task performance metric:', error);
    return null;
  }

  return data;
}

/**
 * Get all performance metrics for a user
 */
export async function getAllTaskPerformanceMetrics(
  userId: string
): Promise<TaskPerformanceMetric[]> {
  const { data, error } = await supabase
    .from('task_performance_metrics')
    .select('*')
    .eq('user_id', userId)
    .order('average_time_variance', { ascending: false });

  if (error) {
    console.error('Error fetching task performance metrics:', error);
    return [];
  }

  return data || [];
}
