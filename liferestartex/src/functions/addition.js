export function getRate(type, value) {
    switch(type) {
        case 'times':
            if(value >= 100) return {2:60};
            if(value >= 70) return {2:50};
            if(value >= 50) return {2:40};
            if(value >= 30) return {2:30};
            if(value >= 10) return {2:20};
            return {2: 10};
        case 'achievement':
            if(value >= 100) return {3:60};
            if(value >= 70) return {3:50};
            if(value >= 50) return {3:40};
            if(value >= 30) return {3:30};
            if(value >= 10) return {3:20};
            return {3:10};
        default: return {};
    }
}

export function getGrade(type, value) {
    switch(type) {
        case 'times':
        case 'achievement':
            if(value >= 100) return 3;
            if(value >= 50) return 2;
            if(value >= 10) return 1;
            return 0;
        case 'talentRate':
            if(value >= 0.9) return 3;
            if(value >= 0.6) return 2;
            if(value >= 0.3) return 1;
            return 0;
        case 'eventRate':
            if(value >= 0.6) return 3;
            if(value >= 0.4) return 2;
            if(value >= 0.2) return 1;
            return 0;
        default: return 0;
    }
}