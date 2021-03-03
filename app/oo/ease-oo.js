(function() {
    const ease = OO.extend('ease', {});

    ease.create = (F, isStep) => {
        let s, t, d, offset, dir, now, last, v;
        return {
            tick: () => {
                now = Date.now();
                v = F(s, t, now - offset, d); //console.log(now-offset, v * dir);
                if(isStep) {
                    const change = last - v;
                    last = v;
                    return change * dir;
                }
                return v * dir;
            },
            timeLeft: () =>  {
                return d - (now - offset);
            },
            distanceLeft: () => {
                return t - v;
            },
            init: (startValue, targetValue, duration, direction) => {
                s = startValue;
                t = targetValue;
                d = duration;
                now = offset = Date.now();
                dir = direction;
                last = 0;
                v = 0;
                //console.log({s, t, d, offset, dir});
            }
        };
    };

    ease.easeOutQuad = (s, t, c, d) => {
        c /= d;
        return -t*c*(c-2)+s;
    };

    ease.linearTween = (s, t, c, d) => {
        return c*t/d+s;
    };

})();

