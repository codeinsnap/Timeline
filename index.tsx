import React, { useState, useEffect, useCallback } from "react";
import VPTBFilters from "@/components/Manager/VehicleProgressTrackingBoard/VPTBFilters";
import GnattChart from "@/components/Manager/VehicleProgressTrackingBoard/GnattChart";
import { TBreak, TRawPlannedData, Tgroup } from "./GnattChart/gnatt_chart_types";
import { useDispatch, useSelector } from "react-redux";
import { fetchVehicleProgressTrackingAction } from "@/store/actions/vehicleAccessTrackingBoardAction";
import { handleUniqueStallsAndProdLines } from "./GnattChart/gnatt_chat_helper";
import moment from "moment";

const initialFilterState = {
  selectedLines: [''],
  selectedMembers: [''],
  selectedStalls: [''],
  selectedStatus: [''],
  selectedVins: [''],
  fromTime:'',
  toTime:''
}
export default function VPTBWrapper() {
  const vehicleData = useSelector((state) => (state as any).vehilceProgress);
  const dispatch: any = useDispatch();
  const [filters, setFilters] = useState(initialFilterState);
  const [filteredGroups, setFilteredGroups] = useState<Tgroup>([])
  const [filteredPlannedData, setFilteredPlannedData] = useState<TRawPlannedData[]>([])
  const [vinTimeDuration, setVinTimeDuration] = useState<any>({fromTime: null, toTime: null});
  const localOffset = moment().utcOffset();
  //TODO - change the timezone to pickup from api
  const timezoneOffset = moment().tz('America/Los_Angeles').utcOffset();
  const today = moment().add(timezoneOffset - localOffset, 'm').valueOf();
  const newCurrentTime = `${new Date().toISOString().slice(0, 10)} ${moment(today).format('HH:mm:ss')}`
  const updated = moment(newCurrentTime, 'YYYY-MM-DD HH:mm:ss');
  const [isFilteredApplied, setIsFilteredApplied] = useState(false)
  const [timeFilters, setTimeFilters] = useState({fromTime: '', toTime: ''})

  useEffect(() => { dispatch(fetchVehicleProgressTrackingAction()) }, []);

  const { PlannedData, ShiftDetails } = vehicleData?.vehilceTimeSheet;
  const groups = useCallback(() => {return handleUniqueStallsAndProdLines(PlannedData ?? []) ?? []}, [PlannedData])

  const handleGroups = useCallback((selectedLines: string[], selectedStalls: string[]) => {
    
    let newGroupList: Tgroup = []
    selectedLines.forEach((line: string) => {
      const filteredList = groups().filter(element => element.prod_line === line)
      newGroupList = [...newGroupList, ...filteredList]
    });
    if (selectedStalls.length > 0 && selectedLines.length > 0 && newGroupList.length > 0) {
      let newList: Tgroup = []
      selectedStalls.forEach((stall: string) => {
        const stallNumber = stall.split('_')
        const filteredList = newGroupList.filter(element => Number(element.stall) === Number(stallNumber[1]) && element.prod_line === stallNumber[0] )
        newList = [ ...newList, ...filteredList]
      });
      setFilteredGroups(handleSorting(newList) as Tgroup)
    } else {
      setFilteredGroups(handleSorting(newGroupList) as Tgroup)
    }
}, [groups])
  
  const applyFilters = useCallback(() => {
    if (filters.selectedLines.length > 0)handleGroups(filters.selectedLines, filters.selectedStalls)
    else setFilteredGroups([])

    if(filters.selectedVins.length > 0 ) {
      let newPlannedDataList: TRawPlannedData[] = [];
      let vinTime = { fromTime: null, toTime: null };
      const newSetofData: {stall: string [], lines: string[], plannedData:TRawPlannedData[] } = {
        stall: [],
        lines: [],
        plannedData: []
      }
      filters.selectedVins.forEach((filterVin : string) => {
      const values = filterVin?.split('_')
        const vinNumber = values[2]
        const stall = values[1]
        const prodLine = values[0]
        if (filters.selectedLines.length === 0 && filters.selectedStalls.length === 0) {
          const filteredList = (PlannedData as TRawPlannedData[]).filter(element => {
              const isFiltered = element.vin === vinNumber;
              if (isFiltered) {
                const uniqueLine = newSetofData.lines.includes(element.prod_line)
                const uniqueStall = newSetofData.stall.includes(`${element.prod_line}_${element.stall}`)
                if (!uniqueLine) {
                  newSetofData.lines = [...newSetofData.lines, element.prod_line]
                }
                if (!uniqueStall) {
                  newSetofData.stall = [...newSetofData.stall, `${element.prod_line}_${element.stall}`]
                }

                // for vin start time and end time 
                const fromTimeArr = element.planned_start_time.split(':');
                const toTimeArr = element.planned_end_time.split(':');
                const fromTime: any = moment(updated).set({
                  hour: parseInt(fromTimeArr[0]),
                  minute: parseInt(fromTimeArr[1]),
                  second: parseInt(fromTimeArr[2])
                }).valueOf();
                const toTime: any = moment(updated).set({
                  hour: parseInt(toTimeArr[0]),
                  minute: parseInt(toTimeArr[1]),
                  second: parseInt(toTimeArr[2])
                }).valueOf();
                if (!vinTime.fromTime) {
                  vinTime = { fromTime, toTime };
                } else if (fromTime < vinTime.fromTime) {
                  vinTime = { fromTime, toTime: vinTime.toTime };
                } else if (vinTime.toTime && toTime > vinTime.toTime) {
                  vinTime = { toTime, fromTime: vinTime.fromTime };
                }
              }
              return isFiltered
          });  
          newSetofData.plannedData = [...newSetofData.plannedData, ...filteredList]
          newPlannedDataList = newSetofData.plannedData
        } else {
          const filteredList = (PlannedData as TRawPlannedData[]).filter(element => { 
            const isFiltered = element.vin === vinNumber && element.prod_line === prodLine && element.stall === stall
            
            if(isFiltered){
              const fromTimeArr = element.planned_start_time.split(':');
              const toTimeArr = element.planned_end_time.split(':');
              const fromTime:any =  moment(updated).set({ 
                  hour: parseInt(fromTimeArr[0]), 
                  minute: parseInt(fromTimeArr[1]), 
                  second: parseInt(fromTimeArr[2]) }).valueOf();
              const toTime: any = moment(updated).set({ 
                hour: parseInt(toTimeArr[0]), 
                minute: parseInt(toTimeArr[1]), 
                second: parseInt(toTimeArr[2]) }).valueOf();
              if (!vinTime.fromTime) {
                vinTime = { fromTime, toTime };
              } else if (fromTime < vinTime.fromTime) {
                vinTime = { fromTime, toTime: vinTime.toTime };
              } else if (vinTime.toTime && toTime > vinTime.toTime) {
                vinTime = { toTime, fromTime: vinTime.fromTime };
              }
            }
            return isFiltered;
          });
          newPlannedDataList = [...newPlannedDataList, ...filteredList]
        }
      })
      newSetofData.lines.length > 0 && newSetofData.stall.length > 0 && handleGroups(newSetofData.lines, newSetofData.stall)
      setVinTimeDuration(vinTime);
      setFilteredPlannedData(newPlannedDataList)
      setIsFilteredApplied(true)
    } else{
      setVinTimeDuration({fromTime: null, toTime: null});
    }

    if(filters.fromTime || filters.toTime) {
      setTimeFilters({fromTime: filters.fromTime, toTime: filters.toTime})
    }

  }, [filters.selectedLines, filters.selectedStalls, filters.selectedVins, filters.fromTime, filters.toTime, handleGroups, PlannedData, updated])

  const handleResetFilter = useCallback(() => {
    setFilteredGroups([])
    setFilteredPlannedData([])
    setVinTimeDuration({fromTime: null, toTime: null});
    setIsFilteredApplied(false)
    setTimeFilters({fromTime: '', toTime: ''});
    dispatch(fetchVehicleProgressTrackingAction());
  }, [dispatch])

  if(!vehicleData || !vehicleData?.vehilceTimeSheet) return <></>

  return (
    <div className="flex flex-col justify-between">
      <VPTBFilters 
        setFilters={setFilters} 
        handleResetFilter={handleResetFilter} 
        applyFilters={applyFilters} 
      />
      <GnattChart 
          vinTimeDuration={vinTimeDuration}
          groups={filteredGroups.length > 0 ? filteredGroups : groups()}
          breaks = {ShiftDetails?.breaks ?? [] as TBreak[]}
          plannedData = {filteredPlannedData.length > 0 ? filteredPlannedData : PlannedData as TRawPlannedData[]}
          isFilteredApplied = {isFilteredApplied}
          timeFilters={timeFilters}
       />
    </div>
  );
}
