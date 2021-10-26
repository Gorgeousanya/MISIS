import React from "react";
import 'react-toastify/dist/ReactToastify.css';
import styled from "styled-components";
import {createAssistant, createSmartappDebugger,} from "@sberdevices/assistant-client";
import {Container, DeviceThemeProvider, Spinner,} from '@sberdevices/plasma-ui';
import {detectDevice} from '@sberdevices/plasma-ui/utils';

import {
  createUser,
  getGroupById,
  getGroupByName,
  getIdTeacherFromDb,
  getInTeacherFromDb,
  getScheduleFromDb,
  getScheduleTeacherFromDb,
  getUser,
  IsEnslishGroupExist,
  IScheduleApiData,
  IScheduleLessonInfo, ITeacherApiData, setGroupStar, setTeacherStar,
} from "./APIHelper";
import {ACCENT_TEXT_COLOR, DEFAULT_TEXT_COLOR,} from './components/consts';

import DashboardPage from './pages/DashboardPage';

import HomePage from './pages/HomePage';
import NavigatorPage from './pages/NavigatorPage';
import ScheduleDayFull from "./components/ScheduleDayFull";
import SpinnerPage from "./pages/SpinnerPage";
import TopMenu from './components/TopMenu';
import WeekCarousel from "./components/WeekCarousel";
import WeekSelect from "./components/WeekSelect";

import buildings from './data/buldings.json'
import filial from './data/filial.json';
import schedule from "./schedule";
import {dayLessons} from "./stories/consts";

import {Bell} from './types/ScheduleStructure'

import "./themes/App.css";
import {DocStyle, getThemeBackgroundByChar} from "./themes/tools";
import {AssistantAction, AssistantEvent, NowOrWill,} from './types/AssistantReceiveAction.d'
import {
  AssistantSendAction,
  AssistantSendActionSay,
  AssistantSendActionSay1,
  AssistantSendActionSay5,
  AssistantSendActionSay6,
} from './types/AssistantSendAction.d'

import {
  CHAR_SBER,
  CHAR_TIMEPARAMOY,
  Character,
  DAY_NOT_SUNDAY,
  DAY_SUNDAY,
  DAY_TODAY,
  DAY_TOMORROW,
  IDayHeader,
  LESSON_EXIST,
  OTHER_WEEK,
  StartOrEnd,
  THIS_OR_OTHER_WEEK,
  THIS_WEEK,
  TodayOrTomorrow,
  IBuilding,
} from './types/base.d'
import {
  formatDateWithDashes,
  formatDateWithDots,
  formatTimeHhMm,
  getFullGroupName,
  MS_IN_DAY,
  pairNumberToPairText
} from './utils';

export const HOME_PAGE_NO = 0;
export const NAVIGATOR_PAGE_NO = 15;
export const DASHBOARD_PAGE_NO = 16;
export const SCHEDULE_PAGE_NO = 17;

const INITIAL_PAGE = 17;

const SEVEN_DAYS = 7 * MS_IN_DAY;
const FILL_DATA_TO_OPEN_TEXT = "Заполни данные, чтобы открывать расписание одной фразой";
const TO_VIEW_SET_GROUP_TEXT = "Чтобы посмотреть расписание, укажите данные учебной группы";

const initializeAssistant = (getState) => {
  if (process.env.NODE_ENV === "development") {
    return createSmartappDebugger({
      token: process.env.REACT_APP_TOKEN ?? "",
      initPhrase: `Запусти ${process.env.REACT_APP_SMARTAPP}`,
      getState,
    });
  }
  return createAssistant({getState});
};

export const MyDiv100 = styled.div`
  width: 100px;
  height: 100px;
`;

export const MyDiv200 = styled.div`
  width: 200px;
  height: 200px;
`;

// const PAIR_NAME_IDX = 0;
// const TEACHER_NAME_IDX = 1;
// const PAIR_NO_IDX = 5;

const breaks = {
  '1': '09:00',
  '2': '10:35-10:50',
  '3': '12:25-12:40',
  '4': '14:15-14:30',
  '5': '16:05-16:20',
  '6': '17:55-18:10',
  '7': '19:45'
}

const dayNameDict = {
  "Пн": ["В понедельник", 1],
  "Вт": ["Во вторник", 2],
  "Ср": ["В среду", 3],
  "Чт": ["В четверг", 4],
  "Пт": ["В пятницу", 5],
  "Сб": ["В субботу", 6]
}

/**
 * Порядковые числительные именительный падеж
 */
const ordinalNominativeCaseSingularFemDict = {
  "1": "первая",
  "2": "вторая",
  "3": "третья",
  "4": "четвертая",
  "5": "пятая",
  "6": "шестая",
  "7": "седьмая"
}

/**
 *
 */
const ordinalGenitiveCaseSingularFemDict = {
  1: "первой",
  2: "второй",
  3: "третьей",
  4: "четвертой",
  5: "пятой",
  6: "шестой",
  7: "седьмой"
}

/**
 *
 */
const numPron = {
  0: "ноль",
  1: "одна",
  2: "две",
  3: "три",
  4: "четыре",
  5: "пять",
  6: "шесть",
  7: "семь",
}

/**
 * Время начала и конца пар
 */

export interface StartEnd {
  start: string
  end: string
}

export const LessonStartEnd: StartEnd[] = [
  {start: "9:00", end: "10:35"},
  {start: "10:50", end: "12:25"},
  {start: "12:40", end: "14:15"},
  {start: "14:30", end: "16:05"},
  {start: "16:20", end: "17:55"},
  {start: "18:10", end: "19:45"},
  {start: "20:00", end: "21:35"}
]

/**
 *
 */
const TODAY_TOMORROW_DICT = {
  [DAY_TODAY]: 1,
  [DAY_TOMORROW]: 0,
}


const NO_LESSONS_NAME = "Пар нет 🎉"

const DAYS_OF_WEEK_SHORT_RU = []

const DEFAULT_STATE_DAY: IDayHeader[] = [
  {
    title: 'Пн',
    date: ["", ""],
    count: [0, 0]
  }, {
    title: 'Вт',
    date: ["", ""],
    count: [0, 0]
  }, {
    title: 'Ср',
    date: ["", ""],
    count: [0, 0]
  }, {
    title: 'Чт',
    date: ["", ""],
    count: [0, 0]
  }, {
    title: 'Пт',
    date: ["", ""],
    count: [0, 0]
  }, {
    title: 'Сб',
    date: ["", ""],
    count: [0, 0]
  }
]


export type ThisOtherWeekBells = Bell[]
export type DayBells = ThisOtherWeekBells[]
export type IScheduleDays = DayBells[]

//

interface IAppProps {
}

export interface IAppState {
  notes: { id: string, title: string }[];
  userId: string
  page: number
  // logo
  flag: boolean
  checked: boolean
  description: string
  group: string
  groupId: string
  correct: boolean
  i: number
  day: IDayHeader[]
  days: IScheduleDays
  spinner: boolean
  date: number
  today: number

  isGroupError: boolean

  subGroup: string
  isSubGroupError: boolean

  engGroup: string
  isEngGroupError: boolean


  character: Character
    // todo paramoy
    | typeof CHAR_TIMEPARAMOY
  star: boolean
  bd: string

  student: boolean
  teacher: string
  teacherId: string
  teacher_checked: boolean
  teacher_star: boolean
  teacher_bd: string
  teacher_correct: boolean
  isTeacherError: boolean

  // building: IBuilding[]
}

export class App extends React.Component<IAppProps, IAppState> {
  _assistant

  constructor(props: IAppProps) {
    super(props);
    this.setValue = this.setValue.bind(this)
    this.isCorrect = this.isCorrect.bind(this)
    this.handleTeacherChange = this.handleTeacherChange.bind(this)
    this.convertIdInGroupName = this.convertIdInGroupName.bind(this);
    // this.tfRef                = React.createRef();
    console.log('constructor');
    // const bell = Array.from({length: 2}, (v, i) => Array.from({length: 8}, (v, i) => ""))
    this.state = {
      notes: [],
      //
      userId: "",
      //
      page: INITIAL_PAGE,
      // logo: null,
      flag: true,
      checked: true,
      description: "",
      group: "",
      groupId: "",
      subGroup: "",
      engGroup: "",
      correct: false,
      i: 0,
      day: DEFAULT_STATE_DAY,
      days: [],
      spinner: false,
      date: Date.now(),
      today: 0,

      isGroupError: false,
      isTeacherError: false,
      isSubGroupError: false,
      isEngGroupError: false,

      character: CHAR_SBER,

      star: false,
      bd: "",
      student: true,

      teacher: "",
      teacherId: "",
      teacher_checked: false,
      teacher_star: false,
      teacher_bd: "",
      teacher_correct: false,

      // building: building,
    }
    // this.Home                 = Home.bind(this);
    // this.Navigator            = Navigator.bind(this);
    this.Raspisanie = this.Raspisanie.bind(this);
    this.convertIdInGroupName = this.convertIdInGroupName.bind(this);
  }

  componentDidMount() {
    console.log('componentDidMount');

    this._assistant = initializeAssistant(() => this.getStateForAssistant());
    this._assistant.on("data", (event: AssistantEvent) => {
      switch (event.type) {

        case "character":
          console.log('componentDidMount: character:', event.character.id);
          this.setState({character: event.character.id});
          if (event.character.id === CHAR_TIMEPARAMOY) {
            this.setState({description: FILL_DATA_TO_OPEN_TEXT});
          } else {
            this.setState({description: TO_VIEW_SET_GROUP_TEXT});
          }
          break;

        case "smart_app_data":
          console.log("User");
          console.log(event);
          if (event.sub !== undefined) {
            console.log("Sub", event.sub);
            this.setState({userId: event.sub});
            getUser(this.state.userId).then((user) => {

              if (user !== "0") {
                console.log('user', user)
                this.setState({
                  groupId: user.group_id,
                  subGroup: user.subgroup_name,
                  engGroup: user.eng_group,
                  teacherId: user.teacher_id,
                })
                this.convertIdInGroupName()
                if (this.state.teacherId !== "") {
                  getInTeacherFromDb(this.state.teacherId)
                    .then((teacherData) => {
                        const teacher = `${teacherData.last_name} ${teacherData.first_name}. ${teacherData.mid_name}.`;
                        this.setState({
                          teacher
                        })
                      }
                    );
                  getScheduleTeacherFromDb(
                    this.state.teacherId,
                    this.getFirstDayWeek(new Date(this.state.date))
                  )
                    .then((response) => {
                      this.showWeekSchedule(response, 0)
                    });
                  this.ChangePage()
                  this.setState({
                    student: false,
                    page: SCHEDULE_PAGE_NO,
                    teacher_checked: true,
                    teacher_star: true,
                    teacher_bd: this.state.teacherId,
                    teacher_correct: true
                  });
                } else if (this.state.groupId !== "") {
                  getScheduleFromDb(this.state.groupId, this.state.engGroup, this.getFirstDayWeek(new Date(this.state.date))).then((response) => {
                    this.showWeekSchedule(response, 0)
                  }).then(() => {
                    console.log("Get shcedule")
                    this.ChangePage()
                    this.setState({
                      page: SCHEDULE_PAGE_NO,
                      checked: true,
                      star: true,
                      bd: this.state.groupId,
                      student: true
                    });
                  });

                } else {
                  this.ChangePage()
                  this.setState({page: HOME_PAGE_NO});
                }
              } else {
                this.ChangePage()
                this.setState({page: HOME_PAGE_NO});
              }
            })
          }
          console.log(`assistant.on(data)`, event);
          const {action} = event;
          this.dispatchAssistantAction(action);
          break

        default:
          break
      }
    });
    this._assistant.on("start", (event) => {
      console.log(`_assistant.on(start)`, event);
    });
    this._assistant.on("ANSWER_TO_USER", (event) => {
      console.log(`_assistant.on(raw)`, event);
    });
  }

  TimуByLessonNum(num) {
    return LessonStartEnd[num].start + " - " + LessonStartEnd[num].end
  }

  setValue(key: string, value: any) {
    console.log(`setValue: key: ${key}, value:`, value);
    console.log(this.state.group)
    switch (key) {
      case "group":
        this.setState({group: value});
        break;
      case "subGroup":
        this.setState({subGroup: value});
        break;
      case "teacher":
        this.setState({teacher: value});
        break;
      case "page":
        this.ChangePage()
        this.setState({page: value});
        break;
      case "student":
        this.setState({student: value});
        break;
      case "teacher_checked":
        this.setState({teacher_checked: value});
        break;
      case "engGroup":
        this.setState({engGroup: value});
        break;
      case "checked":
        this.setState({checked: value});
        break;
      case "description":
        this.setState({description: value});
        break;
      case "bd":
        this.setState({bd: value});
        break;
      case "teacher_bd":
        this.setState({teacher_bd: value})
        break;
      default:
        break;
    }
  }

  getIsCorrectTeacher(): boolean {
    const isStudent = this.state.student;
    const isTeacherCorrect = this.state.teacher_correct;
    return !isStudent && isTeacherCorrect
  }

  // определяет когда начинаются пары сегодня или завтра
  getStartFirstLesson(todayOrTomorrow: TodayOrTomorrow): string | undefined {
    const dayShift = TODAY_TOMORROW_DICT[todayOrTomorrow]
    const weekDayIndex = this.state.today - dayShift;
    for (let bell in this.state.days[weekDayIndex]) {
      const lessonName = this.state.days[weekDayIndex][bell][THIS_WEEK].lessonName
      if (lessonName !== "") {
        return LessonStartEnd[Number(bell)].start
      }
    }
  }

  // определяет когда кончаются пары сегодня или завтра
  getEndLastLesson(todayOrTomorrow: TodayOrTomorrow): string {
    const dayShift = TODAY_TOMORROW_DICT[todayOrTomorrow]
    const dayNumber = this.state.today - dayShift;
    console.log(`getEndLastLesson: todayOrTomorrow: ${todayOrTomorrow}, dayShift: ${dayShift}, dayNumber: ${dayNumber}`);

    for (let lessonIdx = 6; lessonIdx > 0; lessonIdx--) {
      const lessonName = this.state.days[dayNumber][lessonIdx][THIS_WEEK].lessonName
      if (lessonName !== "") {
        return LessonStartEnd[lessonIdx].end
      }
    }
    return '';
  }

  // определяет начало или конец энной пары сегодня или завтра
  getBordersRequestLesson(startOrEnd: StartOrEnd, todayOrTomorrow: TodayOrTomorrow, lessonNum: number): string | undefined {
    const dayShift = TODAY_TOMORROW_DICT[todayOrTomorrow]
    const dayNumber = this.state.today - dayShift;
    const lessonName = this.state.days[dayNumber][lessonNum - 1][THIS_WEEK].lessonName;

    if (lessonName !== "") {
      if (startOrEnd === "start") {
        return LessonStartEnd[lessonNum - 1].start
      } else {
        return LessonStartEnd[lessonNum - 1].end
      }
    }
  }

  getStartEndLesson(
    startOrEnd: StartOrEnd,
    todayOrTomorrow: TodayOrTomorrow,
    // todo: lessonNum строка или число ???
    lessonNum,
  ): string | [string, string] | undefined {
    if (todayOrTomorrow === DAY_TODAY && this.state.today === 0) {
      return [todayOrTomorrow, DAY_SUNDAY]

    } else if (todayOrTomorrow === DAY_TOMORROW && this.state.today === 6) {
      return [todayOrTomorrow, DAY_SUNDAY]

    } else if (startOrEnd === "start") {
      if (todayOrTomorrow === DAY_TODAY) {
        if (lessonNum === "0") {
          return this.getStartFirstLesson(todayOrTomorrow)
        } else {
          return this.getBordersRequestLesson(startOrEnd, todayOrTomorrow, lessonNum)
        }
      } else {
        if (lessonNum === "0") {
          return this.getStartFirstLesson(todayOrTomorrow)
        } else {
          return this.getBordersRequestLesson(startOrEnd, todayOrTomorrow, lessonNum)
        }
      }
    } else if (startOrEnd === "end") {
      if (todayOrTomorrow === DAY_TODAY) {
        if (lessonNum === "0") {
          return this.getEndLastLesson(todayOrTomorrow)
        } else {
          return this.getBordersRequestLesson(startOrEnd, todayOrTomorrow, lessonNum)
        }
      } else {
        if (lessonNum === "0") {
          return this.getEndLastLesson(todayOrTomorrow)
        } else {
          return this.getBordersRequestLesson(startOrEnd, todayOrTomorrow, lessonNum)
        }
      }
    }
  }


  /**
   * подсчет количества пар в указанную дату
   * возвращает массив с днем недели и количеством пар в этот день
   *
   * @param {Date} date
   * @returns {string}
   */
  getAmountOfLessons(date: Date): [string, number] | undefined {
    for (let day of this.state.day) {
      for (let week = 0; week < 2; week++) {
        console.log("this.getDateWithDots(date)", formatDateWithDots(date))
        console.log("day.date[week]", day.date[week])
        if (formatDateWithDots(date) === day.date[week]) {
          return [day.title, day.count[week]]
        }
      }
    }
    // if (res !== undefined) {return res}
    // else {return null}
  }

  /**
   * получить текущую пару
   *
   * @param date
   */
  getCurrentLesson(date: Date): string {
    if (this.state.today !== 0) {
      const todayIndex = this.state.today - 1
      const day = this.state.days[todayIndex]
      for (let bellIdx in day) {
        // console.log(`getCurrentLesson: bellIdx: ${bellIdx}, typeof bellIdx: ${typeof bellIdx}`);
        const lesson = day[bellIdx][THIS_WEEK];
        const thisLessonStartEnd = LessonStartEnd[Number(bellIdx)];
        if (
          (formatTimeHhMm(date) > thisLessonStartEnd.start) &&
          (formatTimeHhMm(date) < thisLessonStartEnd.end) &&
          (thisLessonStartEnd.start !== "")
        ) {
          return lesson.lessonNumber
        }
      }
    }
    return '';//'-1';
  }

  /**
   * возвращает количество оставшихся на сегодня пар
   *
   * @param {Date} date
   * @return {number}
   */
  getAmountOfRemainingLessons(date: Date): number {
    let countRemainingLessons = 0
    if ((this.state.today !== 0) && (this.state.today + 1 !== 7))
      for (let bell in this.state.days[this.state.today - 1]) {
        if (
          formatTimeHhMm(date) < LessonStartEnd[Number(bell)].start &&
          LessonStartEnd[Number(bell)].start !== ""
        ) {
          countRemainingLessons += 1
        }
      }
    return countRemainingLessons
  }

  /**
   *
   * @param dayNumber
   * @returns {[
   *   string,   -- строка, содержащая начало пары
   *   string,   -- порядковый номер пары (1 символ)
   * ]}
   */
  getTimeFirstLesson(dayNumber: number): [string, string] {
    let lessonsStart = '';
    let lessonNumber = '';
    let week: THIS_OR_OTHER_WEEK = THIS_WEEK;
    if (dayNumber < this.state.today) {
      week = OTHER_WEEK;
    }
    for (let lessonIdx in this.state.days[dayNumber - 1]) {
      const lesson = this.state.days[dayNumber - 1][lessonIdx][week]
      if (lesson.lessonName !== "") {
        lessonsStart = LessonStartEnd[Number(lessonIdx)].start
        lessonNumber = lesson.lessonNumber;
        break
      }
    }
    return [lessonsStart, lessonNumber];
  }


  getTimeFirstLesson2(dayNumber: number): { startEnd: StartEnd, startHhMm: string, number: string } | undefined {
    let week: THIS_OR_OTHER_WEEK = THIS_WEEK;
    if (dayNumber < this.state.today) {
      week = OTHER_WEEK;
    }
    const dayLessons = this.state.days[dayNumber - 1];

    for (let strLessonIdx in dayLessons) {
      const lesson = dayLessons[strLessonIdx][week]

      if (lesson.lessonName !== "") {
        const lessonStartEnd = LessonStartEnd[Number(strLessonIdx)];

        return {
          startEnd: lessonStartEnd,
          startHhMm: lessonStartEnd.start.slice(0, 5),
          number: lesson.lessonNumber,
        }
      }
    }
    return undefined;
  }


  whatLesson(
    date: Date,
    when: NowOrWill | 'next',
  ): {
    lesson: string,
    type: NowOrWill | 'next',
    num: number,
  } { //определяет название пары, которая идет или будет
    // ключ - номер пары, значение - перерыв до этой пары

    console.log(`whatLesson: when: ${when} date:`, date)

    const isSunday = (this.state.today === 0)
    const todayWorkDayIndex = this.state.today - 1;
    const todayBells = this.state.day[todayWorkDayIndex]
    const todayLessons = this.state.days[todayWorkDayIndex]

    if (isSunday) {
      const result = {
        lesson: '',
        type: when,
        num: -1,
      }
      console.log(`whatLesson: isSunday: result:`, result)
      return result;

    } else {
      console.log('whatLesson: count:', todayBells.count[THIS_WEEK]);
      const firstLessonTimeHhMm = this.getTimeFirstLesson(todayWorkDayIndex + 1)[0].slice(0, 5);

      if (formatTimeHhMm(date) < firstLessonTimeHhMm) {
        console.log('formatTimeHhMm(date) < firstLessonTimeHhMm: true')
      }
      console.log("whatLesson: что за пара", formatTimeHhMm(date), when, firstLessonTimeHhMm);

      // if (this.state.today !== 0) {
      const currLessonNum = this.getCurrentLesson(date);

      //
      if (
        (when === "now") &&
        (currLessonNum !== undefined)
      ) {
        for (let bellIdx in todayLessons) {
          const lesson = todayLessons[bellIdx][THIS_WEEK];

          if (
            (lesson.lessonNumber === currLessonNum) &&
            (lesson.lessonNumber !== "")
          ) {
            return {
              lesson: lesson[0],
              type: "now",
              num: parseInt(currLessonNum)
            };
          }
        }

      } else if (
        (when === "will") &&
        (currLessonNum !== undefined) &&
        (parseInt(currLessonNum) + 1 < 8)
      ) {
        console.log("whatLesson: будет")
        for (let bell in todayLessons) {
          console.log('whatLesson:', parseInt(currLessonNum) + 1);
          const lesson = todayLessons[bell][THIS_WEEK];

          if (
            (lesson.lessonNumber == String(parseInt(currLessonNum) + 1)) &&
            (lesson.lessonNumber !== "")
          ) {
            return {
              lesson: lesson[0],
              type: "next",
              num: parseInt(currLessonNum) + 1
            };
          }
        }
      } else if (
        (this.getTimeFirstLesson(this.state.today)[0].slice(0, 5) !== undefined) &&
        (formatTimeHhMm(date) <= this.getTimeFirstLesson(this.state.today)[0].slice(0, 5))
      ) {
        const firstLessonInfo = this.getTimeFirstLesson(this.state.today)
        console.log('whatLesson:', todayLessons[parseInt(firstLessonInfo[1])][0][0]);

        const lessonNumber = parseInt(firstLessonInfo[1]);
        return {
          lesson: todayLessons[lessonNumber][0][0],
          type: "will",
          num: lessonNumber,
        }
      } else {
        for (let i in breaks) {
          const startTime = breaks[i].slice(0, 5);
          const endTime = breaks[i].slice(6);
          if (
            (
              formatTimeHhMm(date) > startTime &&
              formatTimeHhMm(date) < endTime
            ) &&
            (todayLessons[i][0][5][0] !== "")
          ) {
            return {
              lesson: todayLessons[i][0][0],
              type: "will",
              num: parseInt(i)
            };
          } else {
            return {
              lesson: '',
              type: when,
              num: -1
            };
          }
        }
      }
      // }
    }
    const result = {
      lesson: '',
      type: when,
      num: -1,
    }
    console.log(`whatLesson: not found: result:`, result)
    return result;
  }


  // определяет ближайшую пару, если сейчас идет какая то пара, то сообщает об этом
  whereWillLesson(
    date: Date,
    will: NowOrWill,
  ): {
    audience?: string
    type?: 'current' | 'nearest' | 'next'
    exist?: LESSON_EXIST
  } {
    let nextLessonRoom
    let numberNearestLesson

    // проверяем, что сегодня не воскресенье
    const isSunday = (this.state.today === 0)

    if (!isSunday) {

      // определяем номер ближайшей пары
      for (let i in breaks) {
        const startTime = breaks[i].slice(0, 5);
        const endTime = breaks[i].slice(6);

        if (formatTimeHhMm(date) < breaks['1']) {
          numberNearestLesson = '1';
          break
        } else if (
          formatTimeHhMm(date) > startTime &&
          formatTimeHhMm(date) < endTime
        ) {
          numberNearestLesson = i;
          break
        } else if (formatTimeHhMm(date) > breaks['7']) {
          numberNearestLesson = null
        }
      }
      const amountOfLessons = this.getAmountOfLessons(date);
      if (amountOfLessons && amountOfLessons[1] === 0) {
        return {
          exist: "empty",
        }
      }
      if (numberNearestLesson !== undefined) {
        for (let bell in this.state.days[this.state.today - 1]) {
          // если пара с таким номером есть в расписании
          if (this.state.days[this.state.today - 1][bell][THIS_WEEK].lessonNumber === numberNearestLesson) {
            return {
              audience: this.state.days[this.state.today - 1][bell][THIS_WEEK].room,
              type: "nearest",
              exist: "inSchedule",
            }
          } else {
            // сообщаем, что такой пары нет
            console.log(`Сейчас перерыв. Ближайшей будет ${numberNearestLesson} пара`)
            for (let bell in this.state.days[this.state.today - 1]) {
              if (this.state.days[this.state.today - 1][bell][THIS_WEEK].lessonNumber !== numberNearestLesson) {
                return {
                  audience: this.state.days[this.state.today - 1][bell][THIS_WEEK].room,
                  type: "nearest",
                  exist: "notInSchedule",
                }
              }
            }
          }
        }
      }
      if (numberNearestLesson === undefined && will === "now") {
        // вернуть номер текущей пары
        let whereCurrentLesson
        for (let bell in this.state.days[this.state.today - 1]) {
          if (this.state.days[this.state.today - 1][bell][THIS_WEEK].lessonNumber === this.getCurrentLesson(date)) {
            whereCurrentLesson = this.state.days[this.state.today - 1][bell][THIS_WEEK].room
          }
        }
        if (whereCurrentLesson === "") {
          return {
            exist: "notInSchedule",
          }
        } else {
          return {
            audience: whereCurrentLesson,
            type: "current",
          }
        }
      }
      if (numberNearestLesson === undefined && will === "will") {
        for (let bell in this.state.days[this.state.today - 1]) {
          if (this.state.days[this.state.today - 1][bell][THIS_WEEK].lessonNumber === String(Number(this.getCurrentLesson(date)) + 1)) {
            nextLessonRoom = this.state.days[this.state.today - 1][bell][THIS_WEEK].room
          }
        }
        if (nextLessonRoom !== "") {
          return {
            audience: nextLessonRoom,
            type: "next",
          }
        } else {
          return {
            exist: "endLessons",
          }
        }
      }
    } else {
      return {
        exist: DAY_SUNDAY,
      }
    }
    return {};
  }

  sendData(action: AssistantSendAction) {
    return this._assistant.sendData({
      action
    })
  }

  dispatchAssistantAction(action: AssistantAction) {
    if (action) {
      switch (action.type) {
        case 'profile':
          this.ChangePage()
          return this.setState({page: HOME_PAGE_NO});
          break;

        case 'for_today':
          if ((this.state.group !== "") || (this.state.teacher !== ""))
            if (this.state.today === 0) {

              this.sendData({
                action_id: "todaySchedule",
                parameters: {
                  day: DAY_SUNDAY
                },
              })

              this.ChangePage()
              return this.setState({page: 7});

            } else {
              this.sendData({
                action_id: "todaySchedule",
                parameters: {day: DAY_NOT_SUNDAY},
              })

              this.ChangePage()
              return this.setState({page: this.state.today});
            }
          break;

        case 'for_tomorrow':
          if ((this.state.group !== "") || (this.state.teacher !== ""))
            if (this.state.today + 1 === 7) {
              this.sendData({
                action_id: "tomorrowSchedule",
                parameters: {day: DAY_SUNDAY},
              })
              this.ChangePage()
              return this.setState({page: 7});
            } else {
              this.sendData({
                action_id: "tomorrowSchedule",
                parameters: {day: DAY_NOT_SUNDAY},
              })
              this.ChangePage()
              return this.setState({page: this.state.today + 1});
            }
          break;

        case 'for_next_week':
          if ((this.state.group !== "") || (this.state.teacher !== "")) {
            this.NextWeek();
            this.ChangePage()
            return this.setState({page: 8});
          }
          break;

        case 'for_this_week':
          if ((this.state.group !== "") || (this.state.teacher !== "")) {
            this.ChangePage()
            return this.setState({date: Date.now(), flag: true, page: SCHEDULE_PAGE_NO});
          }
          break;

        case 'when_lesson':
          if ((this.state.group !== "") || (this.state.teacher !== "")) {
            let params: AssistantSendActionSay['parameters'];

            const [type, day, lessonNum] = action.note || [];

            let answer = this.getStartEndLesson(type, day, lessonNum)
            // const [ type, day ] = this.getStartEndLesson(type, day, lessonNum)


            console.log("answer", answer)
            if (answer !== undefined && answer[1] === DAY_SUNDAY) {
              params = {
                type: answer[0],
                day: answer[1],
              }
            } else {
              params = {
                type: type,
                day: day,
                ordinal: ordinalNominativeCaseSingularFemDict[lessonNum],
                time: answer
              }
            }
            this.sendData({
              action_id: "say",
              parameters: params,
            })

            if ((params.day === DAY_TODAY) && (this.state.today !== 0)) {
              this.ChangePage()
              return this.setState({page: this.state.today});
            } else if (this.state.today + 1 === 7) {
              this.ChangePage();
              return this.setState({page: 7});
            } else {
              this.ChangePage();
              this.setState({page: this.state.today + 1});
            }
          }
          break

        case 'how_many':
          let countOfLessons: [string, number] | undefined;
          let day: TodayOrTomorrow;
          let page = 0;
          if ((this.state.group !== "") || (this.state.teacher !== "")) {

            if (action.note !== undefined) {
              const {timestamp, dayOfWeek} = action.note;
              countOfLessons = this.getAmountOfLessons(new Date(timestamp))

              // todo: упростить
              if (String(this.state.today + 1) === dayOfWeek) {
                day = DAY_TODAY;
                page = 0
              } else if (String(this.state.today + 2) === dayOfWeek) {
                day = DAY_TOMORROW;
                page = 0
              } else { // fallback
                day = DAY_TODAY
                page = 0
              }
            } else {
              countOfLessons = this.getAmountOfLessons(new Date(Date.now()))
              day = DAY_TODAY
            }

            let howManyParams: AssistantSendActionSay1['parameters'] = {
              day: DAY_SUNDAY,
            };

            if (this.state.group !== "" && countOfLessons !== undefined) {
              //   howManyParams = {
              //     day: DAY_SUNDAY,
              //   }
              //   // this.ChangePage();
              //   // this.setState({ page: 8 })
              //
              // } else {
              const [dayOfWeek, pairCount] = countOfLessons;

              const pairText = pairNumberToPairText(pairCount);

              howManyParams = {
                lesson: pairText,
                day: day,
                dayName: dayNameDict[dayOfWeek][0],
                amount: numPron[pairCount]
              }
              if (dayNameDict[dayOfWeek][1] < this.state.today) {
                page = 7;
              }
              this.ChangePage();
              this.setState({page: dayNameDict[dayOfWeek][1] + page})
            }

            this.sendData({
              action_id: "say1",
              parameters: howManyParams,
            })
          }
          break

        case 'how_many_left':
          if ((this.state.group !== "") || (this.state.teacher !== "")) {
            let howManyLeftParams
            let amountOfRemainingLessons = this.getAmountOfRemainingLessons(new Date(Date.now()))
            if (this.state.today === 0) {
              howManyLeftParams = {
                day: DAY_SUNDAY,
              }
            } else {
              howManyLeftParams = {
                amount: amountOfRemainingLessons,
                pron: numPron[amountOfRemainingLessons]
              }
            }
            this.sendData({
              action_id: "say2",
              parameters: howManyLeftParams,
            })
            if (this.state.group !== "")
              this.ChangePage();
            if (this.state.today === 0) {
              this.setState({page: 7})
            } else {
              this.setState({page: this.state.today})
            }
          }
          break

        case 'where':
          console.log('ok')
          if ((this.state.group !== "") || (this.state.teacher !== "")) {
            if (action.note === undefined) {
              action.note = {
                "when": "now",
              }
            }
            const whereLessonParams = this.whereWillLesson(new Date(this.state.date), action.note.when)
            this.sendData({
              action_id: "say3",
              parameters: whereLessonParams,
            })
            this.ChangePage();
            if (whereLessonParams.exist === DAY_SUNDAY) {
              //this.setState({ page: 8 })
            } else {
              this.setState({page: this.state.today});
            }
          }
          break

        case 'what_lesson':
          console.log("какая пара")
          if ((this.state.group !== "") || (this.state.teacher !== "")) {
            if (action.note === undefined) {
              action.note = {
                "when": "now",
              }
            }
            const whatlesson = this.whatLesson(new Date(), action.note.when);
            console.log(this.whatLesson(new Date(), action.note.when))
            this.sendData({
              action_id: "say4",
              parameters: whatlesson,
            })
            this.ChangePage();
            if (this.state.today === 0) {
              this.setState({page: 7})
            } else {
              this.setState({page: this.state.today});
            }
          }
          break

        case 'first_lesson':
          if ((this.state.group !== "") || (this.state.teacher !== "")) {
            let number: string;
            let day1: TodayOrTomorrow = DAY_TODAY;
            let page1 = 0;
            if (action.note !== undefined) {
              const {dayOfWeek: strDayOfWeek} = action.note;
              const numDayOfWeek = parseInt(strDayOfWeek) - 1
              console.log('dispatchAssistantAction: first_lesson:', action.note)
              console.log('dispatchAssistantAction: first_lesson:', numDayOfWeek);
              number = this.getTimeFirstLesson(numDayOfWeek)[1]
              if (String(this.state.today + 1) === strDayOfWeek) {
                day1 = DAY_TODAY;
                page1 = 0
              } else if (String(this.state.today + 2) === strDayOfWeek) {
                day1 = DAY_TOMORROW;
                page1 = 0
              }
            } else {
              console.error('dispatchAssistantAction: first_lesson: action.note is undefined');
              // todo: fix fallback
              number = this.getTimeFirstLesson(0)[1];
              day = DAY_TODAY
            }
            let whichFirst: AssistantSendActionSay5['parameters'] = {
              day1: DAY_SUNDAY,
            }
            if (/*this.state.group !== "" && */number !== undefined) {
              // if (number === undefined) {
              //   whichFirst = {
              //     day1: DAY_SUNDAY,
              //   }
              //   // this.ChangePage();
              //   // this.setState({ page: 8 })
              // } else {
              const {dayOfWeek: strDayOfWeek} = action.note;
              const dayOfWeekIdx = parseInt(strDayOfWeek) - 1

              const [dayOfWeekNameLong, dayOfWeekIdx1] = dayNameDict[dayOfWeekIdx];

              whichFirst = {
                num: ordinalGenitiveCaseSingularFemDict[number[0]],
                day: day1,
                dayName: dayOfWeekNameLong
              }
              if (dayOfWeekIdx1 < this.state.today) {
                page1 = 7;
              }

              const newPage = dayOfWeekIdx1 + page1;
              this.ChangePage();
              this.setState({
                page: newPage,
              })
            }
            this.sendData({
              action_id: "say5",
              parameters: whichFirst,
            })
          }
          break

        case 'day_schedule':
          if ((this.state.group !== "") || (this.state.teacher !== "")) {
            let page2 = 0;

            // todo: упростить

            if ((action.note[1] === null) && (action.note[2] === null)) {
              if (!this.state.flag) {
                console.log(this.state.flag);
                page2 = 7;
              } else {
                page2 = 0;
              }

            } else {
              console.log(action.note)
              console.log(parseInt(action.note[0].dayOfWeek) - 1);
              if (action.note[1] !== null) {
                console.log(action.note[1]);
                page2 = 0;
              } else if (action.note[2] !== null) {
                console.log(action.note[2]);
                page2 = 7;
              }
            }

            let daySchedule: AssistantSendActionSay6['parameters'];
            // if (this.state.group !== "") {
            const {dayOfWeek: strDayOfWeek} = action.note[0];
            const dayOfWeekIdx = parseInt(strDayOfWeek) - 1;

            const [dayOfWeekNameLong, dayOfWeekIdx1] = dayNameDict[dayOfWeekIdx];

            daySchedule = {
              dayName: dayOfWeekNameLong,
            }

            const newPage = dayOfWeekIdx1 + page2;
            this.ChangePage();
            this.setState({
              page: newPage,
            })
            // }
            this.sendData({
              action_id: "say6",
              parameters: daySchedule,
            })
          }
          break

        case 'show_schedule':
          console.log("показать расписание");
          if (this.state.page === 0)
            return this.isCorrect();
          break;

        case 'group':
          if (action.note[0] === 0) {
            console.log(action.note[1].data.groupName[0]);
            this.setState({group: action.note[1].data.groupName[0].toUpperCase(), page: HOME_PAGE_NO});
          } else {
            console.log(action.note[1].data.groupName[1])
            this.setState({group: action.note[1].data.groupName[1].toUpperCase(), page: HOME_PAGE_NO})
          }
          break

        case 'subgroup':
          console.log('subgroup', action)
          this.ChangePage();
          this.setState({subGroup: action.note, page: HOME_PAGE_NO});
          break

        default:
        //throw new Error();
      }
    }
  }

  getStateForAssistant() {
    console.log('getStateForAssistant: this.state:', this.state)
    const state = {
      item_selector: {
        items: this.state.notes.map(
          ({id, title}, index) => ({
            number: index + 1,
            id,
            title,
          })
        ),
      },
    };
    console.log('getStateForAssistant: state:', state)
    return state;
  }

  // assistant_global_event(phrase) {
  //   this._assistant.sendData({
  //     action: {
  //       action_id: phrase
  //     }
  //   })
  // }

  async convertIdInGroupName(): Promise<void> {
    let group = await getGroupById(Number(this.state.groupId))
    this.setState({group: group.name})
  }

  convertGroupNameInId() {
    getGroupByName(this.state.group)
      .then((response) => {
        console.log("convertNameInId", response)
        const groupId = String(response.id); // convert to string
        this.setState({groupId: groupId})
      })

  }

  protected isTeacher() {
    return !this.state.student && this.state.teacher_correct
  }

  // получить дату первого дня недели
  getFirstDayWeek(date: Date): string {

    // номер дня недели
    const now = new Date();
    this.setState({today: now.getDay()});

    const weekDay = date.getDay()
    let firstDay: number;
    if (weekDay === 0) {
      firstDay = date.getTime() - (weekDay + 6) * MS_IN_DAY;
      console.log(formatDateWithDashes(new Date(firstDay)))
      //return null
    } else if (weekDay === 1) {
      return formatDateWithDashes(date)
    } else {
      // число первого дня недели
      firstDay = date.getTime() - (weekDay - 1) * MS_IN_DAY;
    }
    return formatDateWithDashes(new Date(firstDay))
  }

  async getScheduleFromDb(date: number) {
    const firstDayWeek = this.getFirstDayWeek(new Date(date));
    if (!this.state.student && this.state.teacher_correct) {
      await getScheduleTeacherFromDb(
        this.state.teacherId,
        firstDayWeek
      ).then((response) => {
        this.showWeekSchedule(response, 1);
      })
    } else {
      await getScheduleFromDb(
        this.state.groupId,
        this.state.engGroup,
        firstDayWeek
      ).then((response) => {
        this.showWeekSchedule(response, 1);
        console.log(response)
      })
    }
    this.setState({date: date, flag: false});
  }

  /**
   * Заполнение расписанием на следующую неделю
   */
  async NextWeek() {
    const datePlusWeek = this.state.date + SEVEN_DAYS;
    return this.getScheduleFromDb(datePlusWeek);
  }

  async CurrentWeek() {
    return this.getScheduleFromDb(Date.now());
  }

  /**
   * Заполнение расписанием на предыдущую неделю
   */
  async PreviousWeek() {
    const dateMinusWeek = this.state.date - SEVEN_DAYS;
    return this.getScheduleFromDb(dateMinusWeek);
  }

  /**
   * заполнение данными расписания из бд
   */
  showWeekSchedule(parsedSchedule: IScheduleApiData, i) {
    console.log("scheduleData", parsedSchedule)
    console.log('showWeekSchedule')
    this.setState({spinner: true});

    let days;
    /*
    При первой загрузке this.state.days равен [] 
    и его надо инициализировать
    */
    if (this.state.days.length == 0) {
      days = new Array(7).fill([]);
      for (let day in days) {
        days[day] = Array(7).fill([])
        for (let bell in days[day]) {
          days[day][bell] = [new Bell(), new Bell()];
        }
      }
    } else {
      days = this.state.days
    }

    for (let day_num = 1; day_num < 7; day_num++) {

      // todo
      let countLessons = this.state.day[day_num - 1].count[i]
      countLessons = 0;

      if (parsedSchedule.schedule !== null) {
        this.state.day[day_num - 1].date[i] = parsedSchedule.schedule_header[`day_${day_num}`].date;
        for (let bell in parsedSchedule.schedule) { //проверка
          let bell_num = Number(bell.slice(-1)) - 1
          let lesson_info: IScheduleLessonInfo = parsedSchedule.schedule[bell][`day_${day_num}`].lessons[0]
          let lesson_info_state: Bell = days[day_num - 1][bell_num][i]

          const subgroup_name = lesson_info?.groups?.[0]?.subgroup_name;

          if (
            (parsedSchedule.schedule[bell_num] !== undefined) &&
            (lesson_info !== undefined) &&
            (subgroup_name !== undefined) &&
            (subgroup_name === this.state.subGroup) &&
            (this.state.subGroup !== "")
          ) {

            lesson_info_state.lessonName = lesson_info.subject_name;
            lesson_info_state.teacher = lesson_info.teachers[0].name;
            lesson_info_state.room = lesson_info.room_name;
            lesson_info_state.lessonType = lesson_info.type;
            // lesson_info_state.lessonNumber = `${bell.slice(5, 6)}. `;
            lesson_info_state.lessonNumber = bell.slice(5, 6);
            lesson_info_state.url = lesson_info.other;
            countLessons++;

          } else if (
            (parsedSchedule.schedule[bell] !== undefined) &&
            (lesson_info !== undefined) &&
            (subgroup_name !== undefined) &&
            (subgroup_name !== this.state.subGroup) &&
            (this.state.subGroup !== "")
          ) {
            lesson_info_state.reset()

          } else if (
            (parsedSchedule.schedule[bell] !== undefined) &&
            (lesson_info !== undefined)
          ) {
            lesson_info_state.lessonName = lesson_info.subject_name;
            lesson_info_state.teacher = lesson_info.teachers[0].name;
            lesson_info_state.room = lesson_info.room_name;
            lesson_info_state.lessonType = lesson_info.type;
            // lesson_info_state.lessonNumber = `${bell.slice(5, 6)}. `;
            lesson_info_state.lessonNumber = bell.slice(5, 6);
            lesson_info_state.url = lesson_info.other;

            for (let name in lesson_info.groups) {
              lesson_info_state.groupNumber += `${lesson_info.groups[name].name} `;
            }
            countLessons++;

          } else {
            lesson_info_state.reset();
          }
        }
        if (countLessons === 0)
          days[day_num - 1][0][i].lessonName = NO_LESSONS_NAME;

      } else {
        days[day_num - 1][0][i].lessonName = NO_LESSONS_NAME;
      }

    }
    this.setState({spinner: true});
    this.setState({days: days});
    console.log("Days", days)
  }


  ChangePage() {

    let timeParam = this.state.page;
    if (timeParam == SCHEDULE_PAGE_NO) {
      return
    }
    let weekParam: THIS_OR_OTHER_WEEK = THIS_WEEK;
    console.log("timeParam", timeParam)
    console.log("WeekParam", weekParam)
    if (timeParam > 7) {
      weekParam = OTHER_WEEK
      timeParam -= 7
    }

    this.setState({i: 0});
    this.setState({star: false});
    if (weekParam === OTHER_WEEK) {
      console.log("OTHER WEEK")
      this.setState({flag: false});
    } else {
      this.setState({flag: true});
    }
    if (this.state.checked) {
      this.setState({star: true});
    } else {
      if (this.state.groupId == this.state.bd) {
        this.setState({star: true});
      } else {
        this.setState({star: false});
      }
    }
    if (this.state.teacher_checked) {
      this.setState({teacher_star: true});
    } else {
      if (this.state.teacherId == this.state.teacher_bd) {
        this.setState({teacher_star: true});
      } else {
        this.setState({teacher_star: false});
      }
    }
  }


  Raspisanie(timeParam: number) {
    console.log('Raspisanie: timeParam:', timeParam)
    let weekParam: THIS_OR_OTHER_WEEK = THIS_WEEK;
    if (timeParam > 7) {
      timeParam -= 7;
      weekParam = OTHER_WEEK
    }
    // this.setState({i: 0});
    const current = this.getCurrentLesson(new Date());
    const day_num = timeParam - 1;
    const index = timeParam;
    const page = weekParam === OTHER_WEEK ? 8 : 0;

    // const groupName = getFullGroupName(this.state.group, this.state.subGroup);

    const formatDate = (weekDayShort, dateDdDotMm) => `${weekDayShort} ${dateDdDotMm}`;

    const isTeacher = this.getIsCorrectTeacher();

    const groupName = getFullGroupName(this.state.group, this.state.subGroup);

    const userToStar = {
      userId: this.state.userId,
      filialId: filial.id,
      groupId: this.state.groupId,
      subGroup: this.state.subGroup,
      engGroup: this.state.engGroup,
      teacherId: this.state.teacherId
    }

    const handleGroupStarChange = async (newValue) => {
      this.setValue("star", newValue);
      this.setValue("checked", newValue)
      this.setValue("bd", newValue
        ? this.state.groupId
        : ''
      )
      return await setGroupStar(userToStar, newValue);
    };

    const handleTeacherStarChange = async (newValue) => {
      this.setValue("teacher_star", newValue)
      this.setValue("teacher_checked", newValue)
      this.setValue("teacher_bd", newValue
        ? this.state.groupId
        : ''
      )
      return await setTeacherStar(userToStar, newValue);
    };


    return (
      <DeviceThemeProvider>
        <DocStyle/>
        {
          getThemeBackgroundByChar(this.state.character)
        }
        <div>
          <Container style={{padding: 0, overflow: "hidden"}}>

            <TopMenu
              subLabel={
                isTeacher
                  ? this.state.teacher
                  : groupName
              }
              starred={
                isTeacher
                  ? this.state.teacher_star
                  : this.state.star
              }
              onStarClick={() => {
                isTeacher
                  ? handleTeacherStarChange(!this.state.teacher_star)
                  : handleGroupStarChange(!this.state.star)
              }}
              onHomeClick={() => this.setState({page: HOME_PAGE_NO})}
              onDashboardClick={() => this.setState({page: DASHBOARD_PAGE_NO})}
              // onNavigatorClick={() => this.setState({page: NAVIGATOR_PAGE_NO})}
            />

            <WeekSelect
              onPrevWeekClick={() => {
                this.setState({spinner: false});
                this.PreviousWeek();
                this.setState({flag: false, page: 8})
              }}
              onThisWeekClick={() => {
                this.CurrentWeek();
                this.setState({flag: true, page: SCHEDULE_PAGE_NO})
              }}
              onNextWeekClick={() => {
                this.setState({spinner: false});
                this.NextWeek();
                this.setState({flag: false, page: 8})
              }}
            />

            <WeekCarousel
              carouselIndex={this.state.i}
              selectedIndex={index - 1}
              markedIndex={weekParam === THIS_WEEK ? this.state.today - 1 : -1 /* current weekday can't be on 'other' week*/}
              cols={
                this.state.day.map(d => {
                  const {title, date} = d;
                  const weekDayShort = title;
                  const dateDdDotMmDotYy = date[weekParam];
                  const dateDdDotMm = dateDdDotMmDotYy.slice(0, 5);
                  return dateDdDotMm
                    ? formatDate(weekDayShort, dateDdDotMm)
                    : '';
                })
              }
              onIndexChange={(index) => this.Index()}
              onSelect={(weekDayIndex) => this.setValue("page", (
                weekDayIndex + page + (weekParam === OTHER_WEEK ? 0 : 1)
              ))}
            />

            <ScheduleDayFull
              isReady={this.state.spinner}
              // days={this.state.days}
              // day_num={day_num}
              dayLessons={
                this.state.days[day_num]?.map(bellsThisOrOtherWeek => bellsThisOrOtherWeek[weekParam])
              }
              currentLessonNumber={current}
              // weekParam={weekParam}
              // timeParam={timeParam}
              isTeacherAndValid={isTeacher}
              isToday={this.state.today === timeParam && weekParam === THIS_WEEK}
              isSunday={timeParam == 7}
              // today={this.state.today}
              // validateTeacher={this.isCorrectTeacher}
              // onSetValue={this.setValue}
              onTeacherClick={async (teacherName) => {
                this.setValue("teacher", teacherName);
                await this.handleTeacherChange();
              }}
            />

            <MyDiv200/>

          </Container>
        </div>
      </DeviceThemeProvider>
    );
  }

  Index() {
    const currI = this.state.i;
    if (currI < 7) {
      this.setState({i: currI + 1});
    } else if (currI > 0) {
      this.setState({i: currI - 1});
    }
  }

  // todo исправить асинхронную работу
  async handleTeacherChange(): Promise<void> {
    console.log(this.state.teacher)

    return getIdTeacherFromDb(this.state.teacher).then((teacherData) => {
      console.log('handleTeacherChange:', teacherData);
      console.log('handleTeacherChange: status:', teacherData.status);

      if (
        (teacherData.status == "-1") ||
        (teacherData.status == "-2")
      ) {
        console.log("handleTeacherChange: teacherData.status:", teacherData.status);
        this.setState({
          isTeacherError: true,
        })

      } else {

        getScheduleTeacherFromDb(
          teacherData.id,
          this.getFirstDayWeek(new Date())
        ).then((response) => {
          this.showWeekSchedule(response, 0);
        });

        const formatTeacherName = (teacherData: ITeacherApiData) => (
          `${teacherData.last_name} ${teacherData.first_name}. ${teacherData.mid_name}.`
        )

        getInTeacherFromDb(teacherData.id).then((parsedTeacher2) => {
          this.setState({
            teacher: formatTeacherName(teacherData)
          })
        })

        this.setState({
          teacherId: teacherData.id,
          student: false,
          teacher_correct: true,
          date: Date.now(),
          flag: true,
          page: SCHEDULE_PAGE_NO,
          isTeacherError: false,
        });

      }
      if (this.state.teacher_checked) {
        createUser(
          this.state.userId,
          filial.id,
          this.state.groupId,
          this.state.subGroup,
          this.state.engGroup,
          this.state.teacherId,
        );
      }
    })
  }

  isCorrect() {
    console.log('App: isCorrect')
    this.setState({correct: false, date: Date.now()})
    let correct_sub = false;
    let correct_eng = false;
    let correct = false

    let promiseGroupName = getGroupByName(this.state.group)
    let promiseEnglishGroup = IsEnslishGroupExist(Number(this.state.engGroup))

    Promise.all([promiseGroupName, promiseEnglishGroup])
      .then((response) => {
        console.log("Response", response)
        let group_response = response[0]
        let english_response = response[1]
        if (group_response["status"] == 1) {
          this.setState({correct: true})
          this.convertGroupNameInId();
          correct = true;
          const groupId = String(response['id']);
          this.setState({groupId: groupId})
        }
        if (english_response == 1) {
          correct_eng = true;
          console.log(`isCorrect: correct_eng: ${correct_eng}`);
        }
        if ((this.state.subGroup === "") || (this.state.subGroup === "1") || (this.state.subGroup === "2")) {
          correct_sub = true;
        }
        if (correct && correct_sub && correct_eng) {
          if (this.state.checked) {
            createUser(
              this.state.userId,
              filial.id,
              this.state.groupId,
              this.state.subGroup,
              this.state.engGroup,
              "");
          }

          getScheduleFromDb(
            group_response["id"],
            String(this.state.engGroup),
            this.getFirstDayWeek(new Date()))
            .then((response) => {
              this.showWeekSchedule(response, 0);
              console.log(String(this.state.engGroup));
              this.setState({flag: true});
              this.convertIdInGroupName();
              this.setState({page: SCHEDULE_PAGE_NO, isGroupError: false});
            })
        } else if (this.state.correct) {
          this.setState({isGroupError: false});

        } else if (this.state.group === "") {
          this.setState({isGroupError: true})
        } else {
          this.setState({isGroupError: true})
        }

        if (!correct_sub) {
          this.setState({isSubGroupError: true})
        } else {
          this.setState({isSubGroupError: false, star: false});
        }

        if (!correct_eng) {
          this.setState({isEngGroupError: true})
        } else {
          this.setState({isEngGroupError: false, star: false});
        }

      })
  }

  Spinner() {
    console.log('Spinner: this.state.spinner:', this.state.spinner)

    const CHECK_INTERVAL = 100;
    const REDIRECT_DELAY = 100;

    // делаем периодическую проверку
    const checkInterval = setInterval(() => {
      console.log("today", this.state.today)

      // если признак `spinner` выставлен
      if (this.state.spinner) {

        // переходим на другую страницу с задержкой
        setTimeout(() => {
          console.log("this.state.flag", this.state.flag)

          const pageNo = this.state.today === 0
            ? this.state.flag ? 7 : 8
            : this.state.flag ? this.state.today : 8
          console.log('Spinner: pageNo:', pageNo)

          // переходим на другую страницу
          this.setState({page: pageNo});

          // if (this.state.today === 0) {
          //    console.log("this.state.flag", this.state.flag)
          //    if (this.state.flag) {
          //      console.log('Spinner: page:', 7)
          //      this.setState({page: 7})
          //    } else {
          //      console.log('Spinner: page:', 8)
          //      this.setState({page: 8})
          //    }
          //  } else if (this.state.flag) {
          //    console.log('Spinner: page: today:', this.state.today)
          //    this.setState({page: this.state.today});
          //  } else {
          //    console.log('Spinner: page:', 8)
          //    this.setState({page: 8});
          //  }
        }, REDIRECT_DELAY);
        clearInterval(checkInterval)
      }
    }, CHECK_INTERVAL);

    return (

      <SpinnerPage
        character={this.state.character}
      />
    )
  }

  render() {
    let {page} = this.state;
    console.log('App: render: page:', page);
    if (page >= 1 && page <= 13) {
      return this.Raspisanie(page);
    }
    switch (page) {
      case HOME_PAGE_NO:
        return <HomePage
          // state={this.state}
          validateInput={this.isCorrect}
          handleTeacherChange={this.handleTeacherChange}
          convertIdInGroupName={this.convertIdInGroupName}
          setValue={this.setValue}
          description={this.state.description}
          character={this.state.character}
          checked={this.state.checked}

          groupId={this.state.groupId}
          group={this.state.group}
          isGroupError={this.state.isGroupError}

          subGroup={this.state.subGroup}
          isSubGroupError={this.state.isSubGroupError}

          engGroup={this.state.engGroup}
          isEngGroupError={this.state.isEngGroupError}

          student={this.state.student}
          teacher={this.state.teacher}
          isTeacherError={this.state.isTeacherError}
          // handleTeacherChange={this.handleTeacherChange}
          teacher_checked={this.state.teacher_checked}
        />
      case NAVIGATOR_PAGE_NO:
        return <NavigatorPage
          buildings={buildings}
          character={this.state.character}
          isMobileDevice={detectDevice() === "mobile"}
          onDashboardClick={() => this.setState({page: DASHBOARD_PAGE_NO})}
          onHomeClick={() => this.setState({page: HOME_PAGE_NO})}
          onScheduleClick={() => this.setState({page: SCHEDULE_PAGE_NO})}
        />
      case DASHBOARD_PAGE_NO:
        const now = new Date();
        const todayIndex = this.state.today - 1;

        const currentLessonIdx = this.getCurrentLesson(now);
        const currentLesson = this.state.days[todayIndex]?.[currentLessonIdx]?.[THIS_WEEK];
        const currentLessonStartEnd = LessonStartEnd[currentLessonIdx]

        const nextLessonIdx = this.whatLesson(now, "next").num;
        const nextLesson = this.state.days[todayIndex]?.[nextLessonIdx]?.[THIS_WEEK];
        const nextLessonStartEnd = LessonStartEnd[nextLessonIdx];

        const todaySummary = {
          date: now,
          lessonCount: this.state.day[todayIndex].count[THIS_WEEK],
          startEnd: {
            start: this.getTimeFirstLesson(todayIndex + 1)[0].slice(0, 5),
            end: this.getEndLastLesson(DAY_TODAY),
          }
        }

        return <DashboardPage
          state={this.state}
          character={this.state.character}
          isTeacherAndValid={this.getIsCorrectTeacher()}

          todaySummary={todaySummary}

          currentLesson={currentLesson}
          currentLessonStartEnd={currentLessonStartEnd}

          nextLesson={nextLesson}
          nextLessonStartEnd={nextLessonStartEnd}

          onGoToPage={(pageNo) => this.setState({page: pageNo})}
          handleTeacherChange={this.handleTeacherChange}
          getCurrentLesson={(date) => this.getCurrentLesson(date)}
          getTimeFirstLesson={(daynum: number) => this.getTimeFirstLesson(daynum)}
          getEndLastLesson={(todayOrTomorrow: TodayOrTomorrow) => this.getEndLastLesson(todayOrTomorrow)}
          whatLesson={(date, when) => this.whatLesson(date, when)}
        />
      case SCHEDULE_PAGE_NO:
        return this.Spinner();
      default:
        break;
    }
  }

}
