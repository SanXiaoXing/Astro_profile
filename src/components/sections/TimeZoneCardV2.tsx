import React, { useState, useEffect } from 'react'
import moment from 'moment-timezone'

const Timezone = ({ timezone }: any) => {
  const [dateTime, setDateTime] = useState('')

  useEffect(() => {
    const interval = setInterval(() => {
      const now = moment().tz(timezone)
      setDateTime(now.format('HH:mm:ss'))
    }, 1000)

    return () => clearInterval(interval)
  }, [timezone])

  return (
    <div style={{justifyContent: 'center', alignItems: 'center'}}>
      <div className="timezone-text">{dateTime}</div>
    </div>
  )
}

export default Timezone