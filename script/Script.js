/* =========================================================
   CHARGEMENT DU PLANNING
========================================================= */
fetch("data/planning.json")

    .then(response => {

        if (!response.ok) {
            throw new Error("Impossible de charger planning.json");
        }

        return response.json();

    })

    .then(data => {

        planningData = data;

        console.log(
            "Planning chargé :",
            planningData
        );

        initialiserSemaines();
    })

    .catch(error => {

        console.error(
            "Erreur planning :",
            error
        );

        const container =
            document.getElementById(
                "planningContainer"
            );

        if (container) {

            container.innerHTML = `

                <div class="planning-error">

                    Impossible de charger
                    les données du planning.

                </div>

            `;

        }
    });


/* =========================================================
   CALCULER LE NUMÉRO DE SEMAINE ISO
========================================================= */

function obtenirNumeroSemaine(date) {

    const d = new Date(date);

    d.setHours(0, 0, 0, 0);

    /*
       ISO : lundi = premier jour
    */

    const jour =
        d.getDay() === 0
            ? 7
            : d.getDay();

    /*
       Se placer sur le jeudi
       de la semaine courante
    */

    d.setDate(
        d.getDate() + 4 - jour
    );

    const debutAnnee =
        new Date(
            d.getFullYear(),
            0,
            1
        );

    return Math.ceil(
        (
            (
                d - debutAnnee
            ) / 86400000
            + 1
        ) / 7
    );

}



/* =========================================================
   CRÉER L'IDENTIFIANT D'UNE SEMAINE
========================================================= */

function obtenirCleSemaine(date) {

    const numero =
        obtenirNumeroSemaine(date);

    /*
       Trouver l'année ISO
    */

    const jeudi =
        new Date(date);

    jeudi.setDate(
        jeudi.getDate()
        +
        (
            4 -
            (
                jeudi.getDay() || 7
            )
        )
    );

    const annee =
        jeudi.getFullYear();

    return `${annee}-S${String(numero).padStart(2, "0")}`;

}
/* =========================================================
   INITIALISER LE FILTRE DES SEMAINES
========================================================= */

function initialiserSemaines() {

    const select =
        document.getElementById(
            "weekSelect"
        );


    if (!select) {

        console.error(
            "L'élément #weekSelect est introuvable."
        );

        return;

    }


    /*
       Créer automatiquement toutes les semaines
       couvertes par les ouvrages
    */

    const semaines = {};


    planningData.forEach(
        ligne => {

            const debut =
                convertirDate(
                    ligne["Début"]
                );


            const fin =
                convertirDate(
                    ligne["Fin"]
                );


            if (
                !debut ||
                !fin
            ) {

                return;

            }


            /*
               Parcourir toutes les dates
               entre début et fin
            */

            const date =
                new Date(debut);


            while (
                date <= fin
            ) {

                const lundi =
                    getMonday(date);


                const dimanche =
                    new Date(lundi);


                dimanche.setDate(
                    lundi.getDate() + 6
                );


                const cle =
                    obtenirCleSemaine(
                        lundi
                    );


                semaines[cle] = {

                    cle: cle,

                    lundi: lundi,

                    dimanche: dimanche

                };


                date.setDate(
                    date.getDate() + 7
                );

            }

        }
    );


    /*
       Transformer en tableau
    */

    const semainesListe =
        Object.values(
            semaines
        );


    /*
       Trier chronologiquement
    */

    semainesListe.sort(
        (a, b) =>
            a.lundi - b.lundi
    );


    /*
       Nettoyer le menu
    */

    select.innerHTML = "";


    /*
       Créer les options
    */

    semainesListe.forEach(
        semaine => {

            const option =
                document.createElement(
                    "option"
                );


            option.value =
                semaine.cle;


            option.textContent =
                `SEMAINE ${
                    obtenirNumeroSemaine(
                        semaine.lundi
                    )
                } · ${
                    formatPeriode(
                        semaine.lundi,
                        semaine.dimanche
                    )
                }`;


            select.appendChild(
                option
            );

        }
    );


    /*
       semaine qui est en cours (instant present)
    */

    if (
        semainesListe.length > 0
    ) {

        const aujourdHui = new Date();

    aujourdHui.setHours(
        0,
        0,
        0,
        0
    );

    const cleSemaineActuelle =
        obtenirCleSemaine(
            aujourdHui
        );

    /*
       Vérifier que la semaine actuelle
       existe dans le planning
    */

    const semaineExiste =
        semainesListe.some(
            semaine =>
                semaine.cle === cleSemaineActuelle
        );


    if (semaineExiste) {

        select.value =
            cleSemaineActuelle;

        afficherSemaine(
            cleSemaineActuelle
        );

    } else {

        /*
           Si aucune donnée n'existe
           pour la semaine actuelle,
           prendre la première semaine
           disponible.
        */

        select.value =
            semainesListe[0].cle;

        afficherSemaine(
            semainesListe[0].cle
        );

    }

}
    /* CHARGEMENT DE SEMAINE */
    select.addEventListener("change", function(){
        afficherSemaine(this.value);
    });
}



/* =========================================================
   AFFICHER UNE SEMAINE
========================================================= */

function afficherSemaine(
    cleSemaine
) {

    /*
       Exemple :
       2026-S35
    */

    const [anneeTexte, numeroTexte] =
        cleSemaine.split("-");


    const annee =
        parseInt(
            anneeTexte
        );


    const numeroSemaine =
        parseInt(
            numeroTexte.replace(
                "S",
                ""
            )
        );

        /* Image maquette */
    mettreAJourImage(numeroSemaine)

        /*Points de vigilance */
    mettreAJourVigi(numeroSemaine)

    /*
       Calculer le lundi
       et le dimanche
    */

    const periode =
        obtenirPeriodeSemaine(
            numeroSemaine,
            annee
        );


    if (!periode) {

        return;

    }


    const lundi =
        periode.lundi;


    const dimanche =
        periode.dimanche;


    /*
       Garder tous les ouvrages
       qui chevauchent la semaine
    */

    const taches =
        planningData.filter(

            ligne => {

                const debut =
                    convertirDate(
                        ligne["Début"]
                    );


                const fin =
                    convertirDate(
                        ligne["Fin"]
                    );


                if (
                    !debut ||
                    !fin
                ) {

                    return false;

                }


                return (

                    debut <= dimanche

                    &&

                    fin >= lundi

                );

            }

        );


    /*
       Mettre à jour le HEADER
    */

    mettreAJourHeader(
        numeroSemaine,
        lundi,
        dimanche
    );


    /*
       Aucune tâche
    */

    if (
        taches.length === 0
    ) {

        document.getElementById(
            "planningContainer"
        ).innerHTML = `

            <div class="planning-empty">

                Aucune donnée disponible
                pour cette semaine.

            </div>

        `;

        return;

    }


    /*
       Construire le planning
    */

    construirePlanning(

        taches,

        lundi,

        dimanche

    );

}
/* =========================================================
   OBTENIR LA PÉRIODE D'UNE SEMAINE ISO
========================================================= */

function obtenirPeriodeSemaine(
    numeroSemaine,
    annee
) {

    /*
       Exemple :

       S32 + 2026
       ↓
       03/08/2026 → 09/08/2026
    */


    const numero =
        parseInt(
            String(numeroSemaine)
                .replace(/\D/g, "")
        );


    if (
        isNaN(numero) ||
        !annee
    ) {

        return null;

    }


    /*
       4 janvier = toujours
       dans la semaine ISO 1
    */

    const quatreJanvier =
        new Date(
            annee,
            0,
            4
        );


    /*
       Lundi de la semaine ISO 1
    */

    const lundiSemaine1 =
        getMonday(
            quatreJanvier
        );


    /*
       Calcul du lundi
       de la semaine demandée
    */

    const lundi =
        new Date(
            lundiSemaine1
        );


    lundi.setDate(

        lundiSemaine1.getDate()
        +
        (
            numero - 1
        ) * 7

    );


    lundi.setHours(
        0,
        0,
        0,
        0
    );


    /*
       Dimanche
    */

    const dimanche =
        new Date(
            lundi
        );


    dimanche.setDate(
        lundi.getDate() + 6
    );


    dimanche.setHours(
        0,
        0,
        0,
        0
    );


    return {

        lundi: lundi,

        dimanche: dimanche

    };

}

/* =========================================================
   METTRE A JOUR IMAGES PAR SEMAINE
========================================================= */
    function mettreAJourImage(numeroSemaine) {
        const image = document.getElementById("modelImage");
        if(!image) return;
        const semaine = `S${String(numeroSemaine).padStart(2,"0")}`;
        image.src = `images/${semaine}.png`;
        image.alt = `Maquette ${semaine}`;
    }

/* =========================================================
=========================================================
   CONSTRUIRE LE PLANNING
   =========================================================
========================================================= */

function construirePlanning(

    taches,

    lundi,

    dimanche

) {


    const container =
        document.getElementById(
            "planningContainer"
        );


    /*
       Construire les 6 jours
    */

    const jours =
        construireJoursSemaine(
            lundi
        );


    /*
       Début du HTML
    */

    let html = `

        <div class="planning-grid">


            <!-- HEADER -->

            <div class="
                planning-row
                planning-header-row
            ">

                <div class="planning-cell">
                    N°
                </div>

                <div class="planning-cell">
                    Ouvrage
                </div>


                <div class="planning-cell">
                    Début
                </div>


                <div class="planning-cell">
                    Fin
                </div>


                <div class="planning-cell">
                    Durée
                </div>


                <div class="planning-cell">
                    Statut
                </div>

    `;


    /*
       Colonnes des jours
    */

    jours.forEach(
        jour => {

            html += `

                <div class="planning-cell">

                    <span>

                        ${nomJourCourt(jour)}

                        <br>

                        ${formatJour(jour)}

                    </span>

                </div>

            `;

        }
    );


    html += `

            </div>

    `;



    /* =====================================================
       TÂCHES
    ====================================================== */

    taches.forEach(
        tache => {


            const debut =
                convertirDate(
                    tache["Début"]
                );


            const fin =
                convertirDate(
                    tache["Fin"]
                );


            /*
               Sécurité
            */

            if (
                !debut ||
                !fin
            ) {

                return;

            }


            const duree =
                calculerDuree(
                    debut,
                    fin
                );


            const statut =
                normaliserStatut(
                    tache["Statut"]
                );


            html += `

                <div class="planning-row">

                    <!-- N° -->

                    <div class="planning-cell task-number">
                        ${tache["N°"] !== undefined
                            ? String(tache["N°"]).padStart(2,"0")
                            :""
                        }
                    </div>
                    <!-- OUVRAGE -->

                    <div class="planning-cell">

                        <div class="task-info">

                            <span class="task-zone">

                                ${
                                    tache["Zone"]
                                    || ""
                                }

                            </span>


                            <span class="task-name">

                                ${
                                    tache["Ouvrage"]
                                    || ""
                                }

                            </span>

                        </div>

                    </div>


                    <!-- DÉBUT -->

                    <div class="
                        planning-cell
                        task-date
                    ">

                        ${formatDate(debut)}

                    </div>


                    <!-- FIN -->

                    <div class="
                        planning-cell
                        task-date
                    ">

                        ${formatDate(fin)}

                    </div>


                    <!-- DURÉE -->

                    <div class="
                        planning-cell
                        task-date
                    ">

                        ${duree} j

                    </div>


                    <!-- STATUT -->

                    <div class="
                        planning-cell
                        task-status
                        ${classeStatut(statut)}
                    ">

                        <span class="status-dot"></span>

                        ${
                            tache["Statut"]
                            || ""
                        }

                    </div>

            `;



            /* =================================================
               GANTT
            ================================================== */

            jours.forEach(
                jour => {


                    /*
                       Une journée est active
                       si elle est comprise
                       entre début et fin.
                    */

                    const actif =

                        jour >= debut
                        &&
                        jour <= fin;


                    html += `

                        <div class="
                            planning-cell
                            gantt-cell
                        ">

                    `;


                    if (actif) {

                        html += `

                            <div class="
                                gantt-bar
                                ${classeGantt(
                                    statut
                                )}
                            ">
                            </div>

                        `;

                    }


                    html += `

                        </div>

                    `;

                }
            );


            html += `

                </div>

            `;

        }
    );


    /*
       Fin
    */

    html += `

        </div>

    `;


    /*
       Insérer dans la page
    */

    container.innerHTML =
        html;

}



/* =========================================================
   CONSTRUIRE LES 6 JOURS
========================================================= */

function construireJoursSemaine(
    lundi
) {

    const jours = [];


    for (
        let i = 0;
        i < 6;
        i++
    ) {


        const jour =
            new Date(
                lundi
            );


        jour.setDate(
            lundi.getDate() + i
        );


        jour.setHours(
            0,
            0,
            0,
            0
        );


        jours.push(
            jour
        );

    }


    return jours;

}



/* =========================================================
   TROUVER LE LUNDI
========================================================= */

function getMonday(
    date
) {

    const result =
        new Date(
            date
        );


    const jour =
        result.getDay();


    const difference =

        jour === 0

            ? -6

            : 1 - jour;


    result.setDate(

        result.getDate()
        +
        difference

    );


    result.setHours(
        0,
        0,
        0,
        0
    );


    return result;

}



/* =========================================================
   CONVERTIR UNE DATE
========================================================= */

function convertirDate(
    valeur
) {

    if (!valeur) {

        return null;

    }


    const date =
        new Date(
            valeur
        );


    if (
        isNaN(
            date.getTime()
        )
    ) {

        return null;

    }


    /*
       Éviter les problèmes
       de fuseau horaire.
    */

    return new Date(

        date.getFullYear(),

        date.getMonth(),

        date.getDate()

    );

}



/* =========================================================
   CALCUL DURÉE
========================================================= */

function calculerDuree(debut, fin) {

    let duree = 0;

    const date = new Date(debut);

    date.setHours(0, 0, 0, 0);

    const dateFin = new Date(fin);

    dateFin.setHours(0, 0, 0, 0);

    while (date <= dateFin) {

        /*
           getDay():

           0 = Dimanche
           1 = Lundi
           2 = Mardi
           3 = Mercredi
           4 = Jeudi
           5 = Vendredi
           6 = Samedi
        */

        if (date.getDay() !== 0) {

            duree++;

        }

        date.setDate(
            date.getDate() + 1
        );
    }

    return duree;
}



/* =========================================================
   NOM DU JOUR
========================================================= */

function nomJourCourt(
    date
) {

    const jours = [

        "Dim",
        "Lun",
        "Mar",
        "Mer",
        "Jeu",
        "Ven",
        "Sam"

    ];


    return jours[
        date.getDay()
    ];

}



/* =========================================================
   FORMAT JOUR
========================================================= */

function formatJour(
    date
) {

    return String(

        date.getDate()

    ).padStart(
        2,
        "0"
    );

}



/* =========================================================
   FORMAT DATE
========================================================= */

function formatDate(
    date
) {

    return (

        String(
            date.getDate()
        ).padStart(
            2,
            "0"
        )

        +

        "/"

        +

        String(
            date.getMonth() + 1
        ).padStart(
            2,
            "0"
        )

        +

        "/"

        +

        date.getFullYear()

    );

}



/* =========================================================
   FORMAT PÉRIODE
========================================================= */

function formatPeriode(
    debut,
    fin
) {


    const mois = [

        "janvier",
        "février",
        "mars",
        "avril",
        "mai",
        "juin",
        "juillet",
        "août",
        "septembre",
        "octobre",
        "novembre",
        "décembre"

    ];


    if (

        debut.getMonth()
        ===
        fin.getMonth()

        &&

        debut.getFullYear()
        ===
        fin.getFullYear()

    ) {

        return (

            `${formatJour(debut)} — ` +

            `${formatJour(fin)} ` +

            `${mois[fin.getMonth()]} ` +

            `${fin.getFullYear()}`

        );

    }


    return (

        `${formatJour(debut)} ` +

        `${mois[debut.getMonth()]} — ` +

        `${formatJour(fin)} ` +

        `${mois[fin.getMonth()]} ` +

        `${fin.getFullYear()}`

    );

}



/* =========================================================
   NORMALISER LE STATUT
========================================================= */

function normaliserStatut(
    statut
) {


    if (!statut) {

        return "non-commence";

    }


    const texte =

        statut
            .toLowerCase()
            .trim();



    /*
       Terminé
    */

    if (
        texte.includes("termin")
    ) {

        return "termine";

    }


    /*
       Critique
    */

    if (
        texte.includes("critique")
    ) {

        return "critique";

    }


    /*
       En cours
    */

    if (

        texte.includes("cours")
        ||
        texte.includes("encours")

    ) {

        return "cours";

    }



    /*
       objectif
    */

    if (

        texte.includes("objectifs")
        ||
        texte.includes("objectif")

    ) {

        return "objectif";

    }



    /*
       Non commencé
    */

    if (
        texte.includes("non commencé")
    ) {

        return "non-commence";

    }


    return "non-commence";

}



/* =========================================================
   CLASSE STATUT
========================================================= */

function classeStatut(
    statut
) {

    switch (
        statut
    ) {


        case "termine":

            return "status-termine";


        case "critique":

            return "status-critique";


        case "cours":

            return "status-cours";


        case "objectif":

            return "status-objectif";


        default:

            return "status-non-commence";

    }

}



/* =========================================================
   CLASSE GANTT
========================================================= */

function classeGantt(
    statut
) {

    switch (
        statut
    ) {

        case "termine":

            return "gantt-termine";


        case "critique":

            return "gantt-critique";

        case "cours":

            return "gantt-cours";


        case "objectif":

            return "gantt-objectif";


        default:

            return "gantt-non-commence";
    }

}
/* =========================================================
   METTRE A JOUR HEADER
========================================================= */
function mettreAJourHeader(
    numeroSemaine,
    lundi,
    dimanche
) {

    const headerWeek =
        document.getElementById(
            "headerWeek"
        );


    const headerPeriod =
        document.getElementById(
            "headerPeriod"
        );


    if (
        !headerWeek ||
        !headerPeriod
    ) {

        return;

    }


    headerWeek.textContent =
        `SEMAINE ${numeroSemaine}`;


    headerPeriod.textContent =
        formatPeriodeMajuscule(
            lundi,
            dimanche
        );

}
/* =========================================================
   FORMAT MAJUSCULE DU MOIS HEADER
========================================================= */
function formatPeriodeMajuscule(
    debut,
    fin
) {

    const mois = [

        "JANVIER",
        "FÉVRIER",
        "MARS",
        "AVRIL",
        "MAI",
        "JUIN",
        "JUILLET",
        "AOÛT",
        "SEPTEMBRE",
        "OCTOBRE",
        "NOVEMBRE",
        "DÉCEMBRE"

    ];


    /*
       Même mois
    */

    if (

        debut.getMonth()
        ===
        fin.getMonth()

        &&

        debut.getFullYear()
        ===
        fin.getFullYear()

    ) {

        return (

            `${formatJour(debut)} — ` +

            `${formatJour(fin)} ` +

            `${mois[fin.getMonth()]} ` +

            `${fin.getFullYear()}`

        );

    }


    /*
       Mois différents
    */

    return (

        `${formatJour(debut)} ` +

        `${mois[debut.getMonth()]} — ` +

        `${formatJour(fin)} ` +

        `${mois[fin.getMonth()]} ` +

        `${fin.getFullYear()}`

    );

}
/* =========================================================
   CHARGEMENT DES POINTS DE VIGILANCE
========================================================= */
let vigilanceData = [];

fetch("data/vigilance.json")

    .then(response => {

        if (!response.ok) {

            throw new Error(
                "Impossible de charger vigilance.json"
            );

        }

        return response.json();

    })

    .then(data => {
        vigilanceData = data;
        console.log("Points de vigilance chargés :", vigilanceData );
        /* Réafficher le points de vigi */
        const select = document.getElementById("weekSelect");
        if (select && select.value) {
            const numeroSemaine = parseInt (
                select.value.split("-")[1].replace("S","")
            );
        mettreAJourVigi(numeroSemaine);
        }
        
    })

    .catch(error => {

        console.error(
            "Erreur points de vigilance :",
            error
        );

    });

    /* =========================================================
   AFFICHER LES POINTS DE VIGILANCE
========================================================= */

function mettreAJourVigi(numeroSemaine) {

    const container =
        document.getElementById(
            "vigilanceContainer"
        );

    if (!container) {

        return;

    }
     const semaine = `S${String(numeroSemaine).padStart(2, "0")}`;
     console.log("Semaine recherchée :" , semaine);

    const points = vigilanceData.filter(point =>
        point["Semaine"] === semaine );
    console.log("Points trouvées :" , points);

    if (
        !points ||
        points.length === 0
    ) {

        container.innerHTML = `
            <div class="vigilance-empty">
                Aucun point de vigilance.
            </div>
        `;

        return;

    }

    let html = "";

    points.forEach(
        point => {

            html += `

                <div class="vigilance-item">

                    <span class="vigilance-dot"></span>

                    <span class="vigilance-text">
                        ${point["Vigilance"]}
                    </span>

                </div>

            `;

        }
    );

    container.innerHTML = html;

}