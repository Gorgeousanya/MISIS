import React from 'react';
import {ComponentStory, ComponentMeta} from '@storybook/react';

import ScheduleDay from '../../components/ScheduleDay';
import {getDayLessons} from "../consts";

export default {
  title: 'components/ScheduleDay',
  component: ScheduleDay,
  argTypes: {
    isReady: {
      type: {name: 'boolean', required: false},
      defaultValue: true,
    },
    dayLessons: {
      defaultValue: getDayLessons(5),
    },
    currentLessonNumber: {
      type: {name: 'string', required: false},
      defaultValue: '2',
    },
    isTeacherAndValid: {
      type: {name: 'boolean', required: false},
      defaultValue: false,
    },
    isToday: {
      type: {name: 'boolean', required: false},
      defaultValue: true,
    },
    isSunday: {
      type: {name: 'boolean', required: false},
      defaultValue: false,
    },
  },
} as ComponentMeta<typeof ScheduleDay>;

const Template: ComponentStory<typeof ScheduleDay> = (args, context) => (
  <ScheduleDay {...args} />
);

export const GroupView = Template.bind({});
GroupView.args = {
  isReady: true,
  isTeacherAndValid: false,
};

export const TeacherView = Template.bind({});
TeacherView.args = {
  isReady: true,
  isTeacherAndValid: true,
};

export const Sunday = Template.bind({});
Sunday.args = {
  isReady: true,
  isSunday: true,
};

export const NotReady = Template.bind({});
NotReady.args = {
  isReady: false,
};
