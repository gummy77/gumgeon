export class PerfStatMonitor {
    Timers = new Map([]);
    Trackers = new Map([]);

    StartTracker(name) {
        this.Trackers.set(name, performance.now());
    }

    EndTracker(name) {
        if(!this.Trackers.has(name)) return;
        let timeDiff = performance.now() - this.Trackers.get(name);
        this.UpdateTimer(name, timeDiff);
    }

    UpdateTimer(name, frameTime) {
        if(!this.Timers.has(name)) {
            this.Timers.set(name, Array(25, frameTime));
        }
        this.Timers.get(name).shift();
        this.Timers.get(name).push(frameTime);
    }

    WipeTimer(name) {
        this.Timers.set(name, Array(1));
    }

    GetTimerMicro(name) {
        if(!this.Timers.has(name)) return;
        let total = 0;
        let count = 0;
        this.Timers.get(name).forEach(element => {
            total += element;
            count++;
        });
        total = total / this.Timers.get(name).length * 1.0;

        return total;
    }
}