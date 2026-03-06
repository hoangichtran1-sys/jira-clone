import cron from "node-cron";

export const scheduleJob = (name: string, time: string, job: () => Promise<void>) => {
    console.log(`Scheduling ${name} at ${time}`);

    return cron.schedule(
        time,
        async () => {
            try {
                await job();
                console.log(`${name} completed`);
            } catch (error) {
                console.log(`${name} failed`, error);
            }
        },
        {
            timezone: "UTC",
        },
    );
};