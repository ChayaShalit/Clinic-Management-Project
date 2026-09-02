const  nodemailer= requier(nodemailer) ;

const getTomorrowDateString = () => {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        return tomorrow.toISOString().split('T')[0];
    };
const getAppointmentsForTomorrow = async () => {
    const Appointment =await Appointment .find({ date: getTomorrowDateString(),
        status: 'confirmed', reminderSent: true, wantsReminder: {$ne:true }
    });
    return appointments;}
    const sendAllTomorrowReminders =async()=>{
        const appointments = await getAppointmentsForTomorrow();
        await Promise.all(appointments.map(async(appointment)=>{
          try{  await sendReminderEmail(appointment);
            appointment.reminderSent = true;
            await appointment.save();
          } catch (error) {
            console.error('Error sending reminder email:', error);
          }
        }));
    }
