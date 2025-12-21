/* =====================================================
   ASSET & ELEMENT DOM
   ===================================================== */
const diceSound   = new Audio("dice_roll.mp3");
const winnerModal = document.getElementById("winnerModal");
const winnerText  = document.getElementById("winnerText");
const btnOk       = document.getElementById("btnOk");
const rankingList = document.getElementById("rankingList");
const rankingBox  = document.getElementById("rankingBox");
const btnRollAll  = document.getElementById("btnRollAll");
const btnReset    = document.getElementById("btnReset");

/* =====================================================
   EVENT GLOBAL
   ===================================================== */
btnOk.onclick = () => {
    winnerModal.classList.add("hidden");
    rankingBox.classList.remove("hidden");
    rankingBox.classList.add("show");
};

/* =====================================================
   1️⃣ ABSTRACTION & INHERITANCE
   -----------------------------------------------------
   GameEntity adalah class induk (abstraksi umum)
   Semua entity game mewarisi sifat dasar dari class ini
   ===================================================== */
class GameEntity {
    constructor(name) {
        this.name = name;
    }

    // Method umum (akan dioverride → polymorphism)
    getInfo() {
        return `Entity: ${this.name}`;
    }
}

/* =====================================================
   2️⃣ INHERITANCE + ENCAPSULATION
   -----------------------------------------------------
   Dice3D mewarisi GameEntity
   Detail animasi dan rotasi disembunyikan (enkapsulasi)
   ===================================================== */
class Dice3D extends GameEntity {
    constructor(element) {
        super("Dice3D");
        this.el = element;
        this.value = 1;

        // Properti internal (enkapsulasi)
        this.rx = 0;
        this.ry = 0;
        this.rz = 0;
    }

    // ABSTRACTION:
    // Pemanggil hanya tahu "roll()", tidak tahu detail animasi
    roll(finalValue) {
        this.value = finalValue;
        diceSound.currentTime = 0;
        diceSound.play();

        const start = performance.now();
        const duration = 3000;

        const animate = (now) => {
            if (now - start < duration) {
                this.rx += 40;
                this.ry += 45;
                this.rz += 30;
                this.el.style.transform =
                    `rotateX(${this.rx}deg) rotateY(${this.ry}deg) rotateZ(${this.rz}deg)`;
                requestAnimationFrame(animate);
            } else {
                this.el.style.transform = this.getRotation(finalValue);
            }
        };
        requestAnimationFrame(animate);
    }

    // ENCAPSULATION:
    // Rotasi dadu disimpan di dalam class
    getRotation(value) {
        return {
            1: "rotateX(0deg) rotateY(0deg)",
            2: "rotateX(90deg) rotateY(0deg)",
            3: "rotateX(0deg) rotateY(-90deg)",
            4: "rotateX(0deg) rotateY(90deg)",
            5: "rotateX(-90deg) rotateY(0deg)",
            6: "rotateX(0deg) rotateY(180deg)"
        }[value];
    }

    // POLYMORPHISM:
    // Method sama (getInfo) tapi perilaku berbeda
    getInfo() {
        return `Dadu menunjukkan angka ${this.value}`;
    }
}

/* =====================================================
   3️⃣ INHERITANCE + ENCAPSULATION
   -----------------------------------------------------
   Player adalah entity game yang memiliki skor & dadu
   ===================================================== */
class Player extends GameEntity {
    constructor(id) {
        super(`Player ${id}`);
        this.totalScore = 0;   // data dibungkus dalam object
        this.lastRoll  = 0;
        this.dice      = null;
        this.scoreEl   = null;
    }

    // ENCAPSULATION:
    // Skor hanya bisa diubah lewat method ini
    addScore(value) {
        this.lastRoll = value;
        this.totalScore += value;
    }

    // POLYMORPHISM
    getInfo() {
        return `${this.name} | Total Skor: ${this.totalScore}`;
    }
}

/* =====================================================
   4️⃣ ABSTRACTION (GAME CONTROLLER)
   -----------------------------------------------------
   Game mengatur alur tanpa peduli detail Player & Dice
   ===================================================== */
class Game extends GameEntity {
    constructor() {
        super("Game");
        this.players = [];
        this.counter = 1;
        this.area = document.getElementById("diceArea");

        btnRollAll.onclick = () => this.rollAll();
        if (btnReset) btnReset.onclick = () => this.resetGame();

        this.renderAddButton();
    }

    resetGame() {
        if (!this.players.length) return;

        if (confirm("Reset semua skor?")) {
            this.players.forEach(p => {
                p.totalScore = 0;
                p.scoreEl.textContent = "0";
            });
            rankingBox.classList.add("hidden");
        }
    }

    getPips(value) {
        return {
            1:[5], 2:[1,9], 3:[1,5,9],
            4:[1,3,7,9], 5:[1,3,5,7,9],
            6:[1,3,4,6,7,9]
        }[value];
    }

    createDiceHTML() {
        const faces = ['front','bottom','right','left','top','back'];
        return faces.map((f, i) => {
            const pips = this.getPips(i + 1);
            let html = "";
            for (let j = 1; j <= 9; j++) {
                html += pips.includes(j) ? `<span class="pip"></span>` : `<span></span>`;
            }
            return `<div class="face ${f}">${html}</div>`;
        }).join("");
    }

    addPlayer() {
        if (this.players.length >= 6) return alert("Maksimal 6 pemain");

        const player = new Player(this.counter++);
        const box = document.createElement("div");
        box.className = "player-box";
        box.innerHTML = `
            <input class="name-input" value="${player.name}">
            <div class="scene"><div class="dice">${this.createDiceHTML()}</div></div>
            <div>Total: <span class="score-val">0</span></div>
            <button class="btnDel">Hapus</button>
        `;

        box.querySelector("input").oninput = e => player.name = e.target.value;
        box.querySelector(".btnDel").onclick = () => {
            box.remove();
            this.players = this.players.filter(p => p !== player);
            this.renderAddButton();
        };

        player.dice = new Dice3D(box.querySelector(".dice"));
        player.scoreEl = box.querySelector(".score-val");

        this.players.push(player);
        this.area.insertBefore(box, document.querySelector(".add-wrapper"));
        this.renderAddButton();
    }

    renderAddButton() {
        document.querySelector(".add-wrapper")?.remove();
        const wrap = document.createElement("div");
        wrap.className = "add-wrapper";
        wrap.innerHTML = `<div class="add-box">+</div>`;
        wrap.onclick = () => this.addPlayer();
        this.area.appendChild(wrap);
    }

    rollAll() {
        if (!this.players.length) return alert("Tambah pemain dulu");

        this.players.forEach(p => {
            const value = Math.floor(Math.random() * 6) + 1;
            p.addScore(value);     // ENCAPSULATION
            p.dice.roll(value);   // ABSTRACTION
        });

        setTimeout(() => this.showResult(), 3200);
    }

    showResult() {
        this.players.forEach(p => p.scoreEl.textContent = p.totalScore);

        const sorted = [...this.players].sort((a, b) => b.totalScore - a.totalScore);
        rankingList.innerHTML = sorted.map(p =>
            `<div>${p.name} : ${p.totalScore}</div>`
        ).join("");

        // POLYMORPHISM nyata
        console.log("=== INFO ENTITAS ===");
        sorted.forEach(p => console.log(p.getInfo()));
        console.log(sorted[0].dice.getInfo());
    }
}

/* =====================================================
   PROGRAM DIJALANKAN
   ===================================================== */
new Game();
