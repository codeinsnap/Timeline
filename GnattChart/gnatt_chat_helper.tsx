import {TPlannedData, Tgroup, Tshift, TstallProdLine, TBreakTimes, TEntries} from './gnatt_chart_types' 


export const handleNewGroups = (groups: Tgroup) => {
  if (groups.length === 0) return [];
  let newList = [];
  for (let i = 0; i <= groups.length; i++) {
    if (groups[i]) {
      newList.push(groups[i]);
      if (i < groups.length) {
        newList.push({
          id: Math.floor(Math.random() * 10),
          title: ``,
          stall: ``,
          line: ``,
          prod_line: ``
        });
      }
    }
  }

  newList.forEach((element, index) => (element.id = index + 1));
  return newList;
};

const containsStallProdLine = (arr: TstallProdLine[], item: TstallProdLine) => {
    return arr.some(elem => elem.stall === item.stall && elem.prod_line === item.prod_line)
}

export const handleUniqueStallsAndProdLines = (plannedData: TEntries[] ) => {
    let uniqueStallsAndProdLines: TstallProdLine[] = [];
    plannedData.forEach(data => {
        const stallProdLine: TstallProdLine = {stall: data.stall, prod_line: data.prod_line};
        if(!containsStallProdLine(uniqueStallsAndProdLines, stallProdLine)) {
            uniqueStallsAndProdLines.push(stallProdLine);
        }
    })

    uniqueStallsAndProdLines.sort((a,b) => {
        if(a.prod_line !== b.prod_line) {
            return a.prod_line.localeCompare(b.prod_line)
        } else {
            return parseInt(a.stall) - parseInt(b.stall)
        }
    })

    return uniqueStallsAndProdLines.map((item, index) => ({id: index + 1, stall: item.stall, prod_line: item.prod_line, title: ''})) ?? []
}

export const splitTimeSlotsByBreaks = (breakTimes: TBreakTimes[], plannedData: TPlannedData[]) => {

  if (breakTimes.length === 0 || plannedData.length === 0) return plannedData

  const updatedTimeSlots: TPlannedData[] = [];
  plannedData.forEach(slot => {
    let isOverLapped = false
    breakTimes.forEach(breakTime => {
      if (isOverlapping(slot, breakTime)) {
        isOverLapped = true
        const prevtime = {start: slot.planned_start_time, end: slot.planned_end_time } 
        const beforeBreak = {...slot, planned_start_time: slot.planned_start_time, planned_end_time: breakTime.breakStart, prevtime }
        const afterBreak = {...slot, planned_start_time: breakTime.breakEnd, planned_end_time: slot.planned_end_time, prevtime}
        if (isValidSlot(beforeBreak)) updatedTimeSlots.push(beforeBreak);
        updatedTimeSlots.push({...slot,serial_no: '', planned_start_time: breakTime.breakStart,planned_end_time: breakTime.breakEnd})
        if (isValidSlot(afterBreak)) updatedTimeSlots.push({...afterBreak, isAfterBreak: true }); 
      } else {
        updatedTimeSlots.push({...slot,serial_no: '', planned_start_time: breakTime.breakStart,planned_end_time: breakTime.breakEnd})
      }
    })
    if (!isOverLapped) updatedTimeSlots.push(slot)
  })
  return updatedTimeSlots;
}

const isOverlapping = (slot: TPlannedData, breakTime: TBreakTimes) => {
  const slotStart = convertTimeToMinutes(slot.planned_start_time)
  const slotEnd = convertTimeToMinutes(slot.planned_end_time)
  const breakStart = convertTimeToMinutes(breakTime.breakStart)
  const breakEnd = convertTimeToMinutes(breakTime.breakEnd)
  return (slotStart < breakEnd && slotEnd > breakStart);
}

const convertTimeToMinutes = (time: string) => {
  if(!time) return 0
  const [hours, minutes] = time?.split(':')?.map(Number);
  return hours * 60 + minutes;
}

const isValidSlot = (slot: TPlannedData) => {
  const slotStart = convertTimeToMinutes(slot.planned_start_time)
  const slotEnd = convertTimeToMinutes(slot.planned_end_time)
  return (slotStart < slotEnd)
}

export const entiresBeforeShiftTimings = (stall: TstallProdLine[], shiftTimings: Tshift ) => {
  if (!stall || !shiftTimings) return []

  const entriesBeforeShift: TPlannedData[] = [];
  const {start, end} = shiftTimings
  const emptyObj = {
    "prod_line": '',
    "stall": '',
    "vin": '',
    "serial_no": "",
    "model_year": "",
    "model_type": "",
    "planned_start_time": '',
    "planned_end_time": '',
    "std_install_time": "",
    "member_id": ""
}

  stall?.forEach(entry => {
    if (entry?.stall) {
      const beforeshift = {
        ...emptyObj,
        "prod_line": entry?.prod_line ?? '',
        "stall": entry?.stall ?? '',
        "planned_start_time": "00:00:00",
        "planned_end_time": start ?? '',
    }

    const middleofShift = {
      ...emptyObj,
      "prod_line": entry?.prod_line ?? '',
      "stall": entry?.stall ?? '',
      "planned_start_time": start,
      "planned_end_time": end,
  }

    const afterShift = {
      ...emptyObj,
      "prod_line": entry?.prod_line ?? '',
      "stall": entry?.stall ??  '',
      "planned_start_time": end ?? '',
      "planned_end_time": '23:59:59',
  }
      entriesBeforeShift.push(beforeshift)
      entriesBeforeShift.push(middleofShift)
      entriesBeforeShift.push(afterShift)
    }
  })
  return entriesBeforeShift
}
