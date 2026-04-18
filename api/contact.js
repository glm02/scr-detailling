import nodemailer from 'nodemailer';

export default async function handler(req, res) {
    // On n'accepte que les requêtes POST (envoi de formulaire)
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Méthode non autorisée' });
    }

    const { name, phone, model, pack } = req.body;

    // --- VARIABLES TELEGRAM ---
    const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

    // --- VARIABLES SMTP (EMAIL) ---
    const SMTP_HOST = process.env.SMTP_HOST;
    const SMTP_PORT = process.env.SMTP_PORT || 587;
    const SMTP_USER = process.env.SMTP_USER;
    const SMTP_PASS = process.env.SMTP_PASS;
    const CONTACT_EMAIL = process.env.CONTACT_EMAIL; // Ton adresse email qui reçoit les alertes

    // Formatage des messages
    const textMessage = `🏎️ *NOUVELLE DEMANDE SCR*\n\n👤 *Client:* ${name}\n📱 *Tél:* ${phone}\n🚘 *Véhicule:* ${model || 'Non précisé'}\n💎 *Formule:* ${pack}`;
    const htmlMessage = `
        <div style="font-family: sans-serif; color: #333;">
            <h2 style="color: #3b82f6;">🏎️ Nouvelle demande de prestation</h2>
            <ul style="list-style-type: none; padding: 0;">
                <li style="margin-bottom: 10px;"><strong>👤 Client :</strong> ${name}</li>
                <li style="margin-bottom: 10px;"><strong>📱 Téléphone :</strong> <a href="tel:${phone}">${phone}</a></li>
                <li style="margin-bottom: 10px;"><strong>🚘 Véhicule :</strong> ${model || 'Non précisé'}</li>
                <li style="margin-bottom: 10px;"><strong>💎 Formule :</strong> ${pack}</li>
            </ul>
        </div>
    `;

    try {
        // 1. Envoi de la requête à Telegram
        if (BOT_TOKEN && CHAT_ID) {
            await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chat_id: CHAT_ID,
                    parse_mode: 'Markdown',
                    text: textMessage
                })
            }).catch(err => console.error("Erreur Telegram:", err));
        }

        // 2. Envoi de l'Email via SMTP
        if (SMTP_HOST && SMTP_USER && SMTP_PASS && CONTACT_EMAIL) {
            const transporter = nodemailer.createTransport({
                host: SMTP_HOST,
                port: Number(SMTP_PORT),
                secure: Number(SMTP_PORT) === 465, // true pour le port 465, false pour 587
                auth: {
                    user: SMTP_USER,
                    pass: SMTP_PASS,
                },
            });

            await transporter.sendMail({
                from: `"Site SCR Detailing" <${SMTP_USER}>`,
                to: CONTACT_EMAIL,
                subject: `Nouvelle demande de devis : ${name} 🏎️`,
                text: textMessage.replace(/\*/g, ''), // Version texte pur (sans les étoiles markdown)
                html: htmlMessage,
            }).catch(err => console.error("Erreur Email:", err));
        }

        // Succès : on renvoie OK au site
        return res.status(200).json({ success: true, message: 'Notifications envoyées avec succès' });

    } catch (error) {
        console.error("Erreur générale serveur:", error);
        return res.status(500).json({ error: 'Erreur interne du serveur' });
    }
}