const diceSound = new Audio("dice_roll.mp3");
const winnerModal = document.getElementById("winnerModal");
const winnerText  = document.getElementById("winnerText");
const btnOk = document.getElementById("btnOk");
const rankingList = document.getElementById("rankingList");
const rankingBox = document.getElementById("rankingBox");
const btnRollAll = document.getElementById("btnRollAll");
const btnReset = document.getElementById("btnReset");

// Tombol OK modal → tampilkan ranking
btnOk.onclick = () => {
    winnerModal.classList.add("hidden");
    rankingBox.classList.add("show");
    rankingBox.classList.remove("hidden");
};

// --- Kelas induk umum ---
class GameEntity {
    constructor(name) {
        this.name = name;
    }
    getInfo() {
        return `Entity: ${this.name}`;
    }
}

// --- Dice3D mewarisi GameEntity ---
class Dice3D extends GameEntity {
    constructor(el) {
        super("Dice3D");
        this.el = el;
        this.value = 1;
        this.rx = 0; this.ry = 0; this.rz = 0;
    }

    roll(finalValue) {
        this.value = finalValue;
        diceSound.currentTime = 0;
        diceSound.play();

        const start = performance.now();
        const duration = 3000;

        const anim = (now) => {
            if (now - start < duration) {
                this.rx += 40; this.ry += 45; this.rz += 30;
                this.el.style.transform = `rotateX(${this.rx}deg) rotateY(${this.ry}deg) rotateZ(${this.rz}deg)`;
                requestAnimationFrame(anim);
            } else {
                this.el.style.transform = this.getRotation(finalValue);
            }
        };
        requestAnimationFrame(anim);
    }

    getRotation(v) {
        return {
            1: "rotateX(0deg) rotateY(0deg)",
            2: "rotateX(90deg) rotateY(0deg)",
            3: "rotateX(0deg) rotateY(-90deg)",
            4: "rotateX(0deg) rotateY(90deg)",
            5: "rotateX(-90deg) rotateY(0deg)",
            6: "rotateX(0deg) rotateY(180deg)"
        }[v];
    }

    // Polymorphism
    getInfo() {
        return `Dadu terakhir menunjukkan: ${this.value}`;
    }
}

// --- Player mewarisi GameEntity ---
class Player extends GameEntity {
    constructor(id) {
        super(`Player ${id}`);
        this.totalScore = 0;
        this.lastRoll = 0;
        this.dice = null;
        this.scoreEl = null;
    }
    
    addScore(val) {
        this.lastRoll = val;
        this.totalScore += val;
    }

    // Polymorphism
    getInfo() {
        return `${this.name} | Skor: ${this.totalScore}`;
    }
}

// --- Game mewarisi GameEntity ---
class Game extends GameEntity {
    constructor() {
        super("Game");
        this.players = [];
        this.idCounter = 1;
        this.area = document.getElementById("diceArea");
        
        btnRollAll.onclick = () => this.rollAll();
        if(btnReset) btnReset.onclick = () => this.resetGame();

        this.renderAddButton();
    }

    resetGame() {
        if (this.players.length === 0) return;
        const yakin = confirm("Reset kabeh skor dadi 0?");
        if (yakin) {
            this.players.forEach(p => {
                p.totalScore = 0;
                p.lastRoll = 0;
                if (p.scoreEl) p.scoreEl.textContent = "0";
            });
            rankingBox.classList.add("hidden");
            winnerModal.classList.add("hidden");
        }
    }

    getPips(v) {
        return { 1:[5], 2:[1,9], 3:[1,5,9], 4:[1,3,7,9], 5:[1,3,5,7,9], 6:[1,3,4,6,7,9] }[v];
    }

    createDiceHTML() {
        const faces = ['front','bottom','right','left','top','back'];
        return faces.map((f, i) => {
            const val = i + 1;
            const pips = this.getPips(val);
            let content = "";
            for(let j=1; j<=9; j++) content += pips.includes(j) ? `<span class="pip"></span>` : `<span></span>`;
            return `<div class="face ${f}">${content}</div>`;
        }).join("");
    }

   addPlayer() {
    if (this.players.length >= 6) {
        alert("Maksimal 6 pemain!");
        // setelah alert, hapus ikon tambah
        const addWrap = document.querySelector(".add-wrapper");
        if (addWrap) addWrap.remove();
        return;
    }

    const p = new Player(this.idCounter++);
    const box = document.createElement("div");
    box.className = "player-box";
    box.innerHTML = `
        <input class="name-input" value="${p.name}">
        <div class="scene"><div class="dice">${this.createDiceHTML()}</div></div>
        <div class="total-score" style="margin: 10px 0; font-size: 14px; color: #8b949e;">
            Total: <span class="score-val" style="color: #3fb950; font-weight: bold;">0</span>
        </div>
        <button class="btnDel">Hapus</button>
    `;

    box.querySelector("input").oninput = (e) => p.name = e.target.value;
    box.querySelector(".btnDel").onclick = () => {
        box.remove();
        this.players = this.players.filter(pl => pl !== p);
        this.renderAddButton(); // kalau ada yang dihapus, ikon tambah muncul lagi
    };

    p.dice = new Dice3D(box.querySelector(".dice"));
    p.scoreEl = box.querySelector(".score-val");
    
    this.players.push(p);
    this.area.insertBefore(box, document.querySelector(".add-wrapper"));
    this.renderAddButton();
}

    renderAddButton() {
        const existing = document.querySelector(".add-wrapper");
        if (existing) existing.remove();
        const wrap = document.createElement("div");
        wrap.className = "add-wrapper";
        wrap.innerHTML = `
            <div class="add-placeholder" style="height:35px"></div>
            <div class="add-box" style="width:100px; height:100px; border:3px dashed #2ea043; border-radius:12px; color:#2ea043; font-size:40px; display:flex; align-items:center; justify-content:center; cursor:pointer;">+</div>
            <div style="height: 60px"></div>
        `;
        wrap.onclick = () => this.addPlayer();
        this.area.appendChild(wrap);
    }

    rollAll() {
        if (this.players.length === 0) return alert("Tambah pemain dhisik!");
        
        rankingBox.classList.add("hidden");
        document.querySelectorAll(".btnDel").forEach(b => b.classList.add("hidden"));
        if(btnReset) btnReset.classList.add("hidden");

        this.players.forEach(p => {
            const val = Math.floor(Math.random() * 6) + 1;
            p.addScore(val);
            p.dice.roll(val);
        });

        setTimeout(() => {
            this.showResults();
            document.querySelectorAll(".btnDel").forEach(b => b.classList.remove("hidden"));
            if(btnReset) btnReset.classList.remove("hidden");
        }, 3200);
    }

    showResults() {
        this.players.forEach(p => p.scoreEl.textContent = p.totalScore);
        const sorted = [...this.players].sort((a, b) => b.totalScore - a.totalScore);
        
        rankingList.innerHTML = sorted.map((p, i) => `
            <div class="rank-row ${i === 0 ? 'rank-top' : ''}" style="display:flex; justify-content:space-between; padding:8px; border-bottom: 1px solid #30363d;">
                <span>${p.name}</span>
                <strong>${p.totalScore} poin</strong>
            </div>
        `).join("");

        const topScore = sorted[0].totalScore;
        const winners = sorted.filter(p => p.totalScore === topScore);

        let pesan = "";
        if (winners.length > 1) {
            pesan = `SERI!\nSkor ${topScore} oleh ${winners.map(w=>w.name).join(", ")}`;
        } else {
            pesan = `PEMENANG!\n${winners[0].name} menang dengan ${topScore} poin!`;
        }

        // Contoh polymorphism
        console.log("=== Info semua entitas ===");
        this.players.forEach(p => console.log(p.getInfo()));
        console.log(sorted[0].dice.getInfo());

        alert(pesan);
        rankingBox.classList.add("show");
        rankingBox.classList.remove("hidden");
    }
}

new Game();
