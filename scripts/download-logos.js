const fs = require('fs');
const path = require('path');
const https = require('https');

// Create directories if they don't exist
const nflDir = path.join(__dirname, '../images/logos/nfl');
const collegeDir = path.join(__dirname, '../images/logos/college');

if (!fs.existsSync(nflDir)) {
    fs.mkdirSync(nflDir, { recursive: true });
}
if (!fs.existsSync(collegeDir)) {
    fs.mkdirSync(collegeDir, { recursive: true });
}

// NFL Teams
const nflTeams = [
    'tennessee-titans',
    'cleveland-browns',
    'new-york-giants',
    'new-england-patriots',
    'jacksonville-jaguars',
    'las-vegas-raiders',
    'new-york-jets',
    'carolina-panthers',
    'new-orleans-saints',
    'chicago-bears',
    'san-francisco-49ers',
    'dallas-cowboys',
    'miami-dolphins',
    'indianapolis-colts',
    'atlanta-falcons',
    'arizona-cardinals',
    'cincinnati-bengals',
    'seattle-seahawks',
    'tampa-bay-buccaneers',
    'denver-broncos',
    'pittsburgh-steelers',
    'los-angeles-chargers',
    'green-bay-packers',
    'minnesota-vikings',
    'houston-texans',
    'los-angeles-rams',
    'baltimore-ravens',
    'detroit-lions',
    'washington-commanders',
    'buffalo-bills',
    'kansas-city-chiefs',
    'philadelphia-eagles'
];

// Colleges
const colleges = [
    'miami',
    'colorado',
    'penn-state',
    'michigan',
    'boise-state',
    'lsu',
    'georgia',
    'texas',
    'missouri',
    'alabama',
    'ohio-state',
    'florida-state',
    'clemson',
    'kansas-state',
    'illinois',
    'washington',
    'north-carolina',
    'duke'
];

function downloadLogo(url, filename) {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(filename);
        https.get(url, (response) => {
            response.pipe(file);
            file.on('finish', () => {
                file.close();
                resolve();
            });
        }).on('error', (err) => {
            fs.unlink(filename, () => {}); // Delete the file if there's an error
            reject(err);
        });
    });
}

// Download NFL logos
async function downloadNflLogos() {
    for (const team of nflTeams) {
        const url = `https://a.espncdn.com/i/teamlogos/nfl/500/${team}.png`;
        const filename = path.join(nflDir, `${team}.png`);
        try {
            await downloadLogo(url, filename);
            console.log(`Downloaded ${team} logo`);
        } catch (error) {
            console.error(`Error downloading ${team} logo:`, error.message);
        }
    }
}

// Download college logos
const downloadCollegeLogo = (college) => {
    return new Promise((resolve, reject) => {
        const url = `https://a.espncdn.com/combiner/i?img=/i/teamlogos/ncaa/500/${college}.png&w=100&h=100&transparent=true`;
        const filePath = path.join(collegeDir, `${college}.png`);
        
        const file = fs.createWriteStream(filePath);
        
        https.get(url, (response) => {
            if (response.statusCode !== 200) {
                reject(new Error(`Failed to download ${college} logo: ${response.statusCode}`));
                return;
            }

            response.pipe(file);
            
            file.on('finish', () => {
                file.close();
                console.log(`Downloaded ${college} logo`);
                resolve();
            });
        }).on('error', (err) => {
            fs.unlink(filePath, () => {}); // Delete the file if there's an error
            reject(err);
        });
    });
};

const downloadAllCollegeLogos = async () => {
    for (const college of colleges) {
        try {
            await downloadCollegeLogo(college);
        } catch (error) {
            console.error(`Error downloading ${college} logo:`, error.message);
        }
    }
};

// Run the downloads
async function main() {
    console.log('Downloading NFL logos...');
    await downloadNflLogos();
    console.log('Downloading college logos...');
    await downloadAllCollegeLogos();
    console.log('All downloads completed!');
}

main().catch(console.error); 