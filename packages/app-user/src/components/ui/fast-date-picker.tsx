import * as React from "react"
import { format } from "date-fns"
import { CalendarIcon, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface FastDatePickerProps {
  date: Date | null
  onDateChange: (date: Date | null) => void
  disabled?: boolean
  placeholder?: string
}

export function FastDatePicker({ date, onDateChange, disabled, placeholder = "Seleziona data" }: FastDatePickerProps) {
  const [month, setMonth] = React.useState(date ? date.getMonth() : 0)
  const [year, setYear] = React.useState(date ? date.getFullYear() : 1990)
  const [open, setOpen] = React.useState(false)

  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: currentYear - 1900 + 1 }, (_, i) => 1900 + i).reverse()
  const months = [
    "Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno",
    "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre"
  ]

  const handleMonthChange = (newMonth: string) => {
    const monthIndex = parseInt(newMonth)
    setMonth(monthIndex)
  }

  const handleYearChange = (newYear: string) => {
    const yearValue = parseInt(newYear)
    setYear(yearValue)
  }

  const displayMonth = new Date(year, month)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal bg-black border-gray-500 text-white hover:bg-gray-900 hover:text-white",
            !date && "text-gray-400"
          )}
          disabled={disabled}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? format(date, "dd/MM/yyyy") : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 bg-black border-[#EEBA2B]" align="start">
        <div className="p-3 border-b border-[#EEBA2B]/20">
          <div className="flex gap-2">
            <Select value={month.toString()} onValueChange={handleMonthChange}>
              <SelectTrigger className="flex-1 bg-black border-[#EEBA2B]/30 text-white">
                <SelectValue />
                <ChevronDown className="h-4 w-4" />
              </SelectTrigger>
              <SelectContent className="bg-black border-[#EEBA2B] text-white max-h-60">
                {months.map((monthName, index) => (
                  <SelectItem key={index} value={index.toString()} className="text-white hover:bg-[#EEBA2B]/20">
                    {monthName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={year.toString()} onValueChange={handleYearChange}>
              <SelectTrigger className="flex-1 bg-black border-[#EEBA2B]/30 text-white">
                <SelectValue />
                <ChevronDown className="h-4 w-4" />
              </SelectTrigger>
              <SelectContent className="bg-black border-[#EEBA2B] text-white max-h-60">
                {years.map((yearValue) => (
                  <SelectItem key={yearValue} value={yearValue.toString()} className="text-white hover:bg-[#EEBA2B]/20">
                    {yearValue}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <Calendar
          mode="single"
          selected={date}
          onSelect={(selectedDate) => {
            onDateChange(selectedDate)
            setOpen(false)
          }}
          month={displayMonth}
          onMonthChange={(newMonth) => {
            setMonth(newMonth.getMonth())
            setYear(newMonth.getFullYear())
          }}
          disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
          initialFocus
          className={cn("p-3 pointer-events-auto")}
          classNames={{
            months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
            month: "space-y-4",
            caption: "flex justify-center pt-1 relative items-center text-white",
            caption_label: "text-sm font-medium text-white",
            nav: "space-x-1 flex items-center",
            nav_button: "h-7 w-7 bg-transparent p-0 hover:bg-[#EEBA2B]/20 text-white hover:text-[#EEBA2B]",
            nav_button_previous: "absolute left-1",
            nav_button_next: "absolute right-1",
            table: "w-full border-collapse space-y-1",
            head_row: "flex",
            head_cell: "text-gray-400 rounded-md w-9 font-normal text-[0.8rem]",
            row: "flex w-full mt-2",
            cell: "text-center text-sm p-0 relative [&:has([aria-selected])]:bg-[#EEBA2B] first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
            day: "h-9 w-9 p-0 font-normal text-white hover:bg-[#EEBA2B]/20 hover:text-[#EEBA2B] aria-selected:opacity-100",
            day_selected: "bg-[#EEBA2B] text-black hover:bg-[#EEBA2B] hover:text-black focus:bg-[#EEBA2B] focus:text-black",
            day_today: "bg-gray-800 text-white",
            day_outside: "text-gray-600 opacity-50",
            day_disabled: "text-gray-600 opacity-50",
            day_range_middle: "aria-selected:bg-[#EEBA2B] aria-selected:text-black",
            day_hidden: "invisible",
          }}
        />
      </PopoverContent>
    </Popover>
  )
}