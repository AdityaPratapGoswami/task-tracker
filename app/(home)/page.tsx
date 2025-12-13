import WeekView from '@/components/WeekView';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import connectToDatabase from '@/lib/db';
import Task, { ITask } from '@/models/Task';
import Gratitude from '@/models/Gratitude';
import Journal from '@/models/Journal';
import { startOfWeek, addDays, format } from 'date-fns';

async function getData() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;

  if (!token) {
    return { tasks: [], gratitudes: [], journals: [] };
  }

  const payload = verifyToken(token);
  if (!payload) {
    return { tasks: [], gratitudes: [], journals: [] };
  }

  await connectToDatabase();

  // Calculate current week range (Server time might differ, but usually OK for initial load)
  // Ideally, we'd use client time, but for SSR we assume "today" at server location or UTC
  const today = new Date();
  const startOfCurrentWeek = startOfWeek(today, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }).map((_, i) => addDays(startOfCurrentWeek, i));
  const startDate = format(weekDays[0], 'yyyy-MM-dd');
  const endDate = format(weekDays[6], 'yyyy-MM-dd');

  const userId = payload.userId;

  // Fetch Tasks
  const query: any = {
    userId: userId,
    $or: [
      {
        type: 'regular',
        date: { $lte: endDate },
        $or: [
          { endDate: { $exists: false } },
          { endDate: { $gte: startDate } }
        ]
      },
      {
        type: 'spontaneous',
        date: { $gte: startDate, $lte: endDate }
      }
    ]
  };

  if (startDate && endDate) {
    // Logic handled in $or above
  } else if (startDate) {
    query.$or[1].date = startDate; // Legacy logic preservation
  }


  // Fetch Data in Parallel
  const [tasksData, gratitudesData, journalsData] = await Promise.all([
    Task.find(query).sort({ createdAt: 1 }).lean(),
    Gratitude.find({
      userId: userId,
      date: { $gte: startDate, $lte: endDate }
    }).lean(),
    Journal.find({
      userId: userId,
      date: { $gte: startDate, $lte: endDate }
    }).lean()
  ]);

  // Process tasks to merge regular ones (Client logic duplicated for SSR)
  const processedTasks: any[] = [];
  const regularTasks = tasksData.filter((t: any) => t.type === 'regular');
  const spontaneousTasks = tasksData.filter((t: any) => t.type === 'spontaneous');

  weekDays.forEach(day => {
    const dateStr = format(day, 'yyyy-MM-dd');

    // Add spontaneous tasks
    const daysSpontaneous = spontaneousTasks.filter((t: any) => t.date === dateStr);
    processedTasks.push(...daysSpontaneous);

    // Add regular tasks
    regularTasks.forEach((regTask: any) => {
      const isCompletedForDay = regTask.completedDates?.includes(dateStr) || false;
      processedTasks.push({
        ...regTask,
        date: dateStr,
        isCompleted: isCompletedForDay,
        _id: regTask._id.toString() // Serialization
      });
    });
  });

  // Serialization helper
  const serialize = (data: any[]) => data.map((item: any) => ({
    ...item,
    _id: item._id.toString(),
    userId: item.userId.toString(),
    createdAt: item.createdAt?.toISOString(),
    updatedAt: item.updatedAt?.toISOString(),
  }));

  return {
    tasks: serialize(processedTasks), // Tasks are already partly processed but need ID stringification
    gratitudes: serialize(gratitudesData),
    journals: serialize(journalsData)
  };
}

export default async function Home() {
  const { tasks, gratitudes, journals } = await getData();

  return (
    <main>
      <WeekView
        initialTasks={tasks}
        initialGratitudes={gratitudes}
        initialJournals={journals}
      />
    </main>
  );
}
