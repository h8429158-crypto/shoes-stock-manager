import { NavigatorScreenParams } from '@react-navigation/native';

export type WorkoutStackParamList = {
  SplitList: undefined;
  SplitEditor: { splitId: string };
  DayEditor: { splitId: string; dayIndex: number };
};

export type TabParamList = {
  Home: undefined;
  Workout: NavigatorScreenParams<WorkoutStackParamList> | undefined;
  History: undefined;
  Progress: undefined;
  Settings: undefined;
};

export type ExercisePickerParams =
  | { target: 'session' }
  | { target: 'splitDay'; splitId: string; dayIndex: number };

export type RootStackParamList = {
  Main: NavigatorScreenParams<TabParamList> | undefined;
  ActiveWorkout: undefined;
  ExercisePicker: ExercisePickerParams;
  PlateCalculator: undefined;
};
