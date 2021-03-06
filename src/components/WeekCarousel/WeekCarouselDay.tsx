import React from "react";
import {Button} from '@sberdevices/plasma-ui';
import 'react-toastify/dist/ReactToastify.css';
import {
  CarouselItem
} from "@sberdevices/plasma-ui";


export const WeekCarouselDay = ({
                                  text,
                                  isSelected,
                                  isMarked,
                                  onClick,
                                }: {
  // date: Date
  text: string
  isSelected: boolean
  isMarked: boolean
  // format?: string
  onClick: (event: React.MouseEventHandler<HTMLElement>) => void
}) => {
  return (
    <CarouselItem>
      <Button
        scrollSnapAlign="start"
        view={isSelected ? "secondary" : "clear"}
        style={{
          margin: "0.5em",
          
          color: isMarked
            ? "var(--plasma-colors-accent)"
            : ""
        }}
        size="s"
        pin="circle-circle"
        text={isMarked ? `Сегодня ${text.toLowerCase()}` : text }
        // text={ text + moment(date).format(format)}
        onClick={(event) => onClick(event)}
      />
    </CarouselItem>
  )
}

export default WeekCarouselDay
