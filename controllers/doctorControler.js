import Appointment from "../models/Appointment";

const getTodayAppointments = async (doctorId) => {
    const today = new Date();
    const startOfDay=new Date(today.setHours(0,0,0,0));
    const endOfDay=new Date(today.setHours(23,59,59,999));
    const appointments = await Appointment.find({
        doctorId: doctorId,
        date: {
            $gte: startOfDay,
            $lte: endOfDay
        },
        status: 'confirmed'
    });
    return appointments;
};
export { getTodayAppointments };
