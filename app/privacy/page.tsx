export const metadata = {
    title: 'Privacy Policy — Balance',
};

export default function PrivacyPage() {
    return (
        <div style={{ maxWidth: 720, margin: '0 auto', padding: '64px 24px 96px' }}>
            <div className="m-kicker" style={{ marginBottom: 10 }}>Balance</div>
            <h1 className="m-title" style={{ fontSize: 40, marginBottom: 32 }}>Privacy Policy</h1>
            <p style={{ color: 'var(--m-neutral-600)', marginBottom: 40 }}>Last updated: July 2026</p>

            <section style={{ marginBottom: 32 }}>
                <h2 className="m-h2" style={{ marginBottom: 12 }}>What Balance is</h2>
                <p>
                    Balance is a personal task-tracking app. This page explains what data it collects
                    and how that data is used.
                </p>
            </section>

            <section style={{ marginBottom: 32 }}>
                <h2 className="m-h2" style={{ marginBottom: 12 }}>Information we collect</h2>
                <p style={{ marginBottom: 12 }}>
                    When you create an account or sign in with Google, we collect your name and email
                    address. If you sign in with Google, we only request your basic profile info
                    (name, email) — nothing else.
                </p>
                <p>
                    Everything else — tasks, categories, objectives and key results, journal and
                    gratitude entries — is content you create yourself while using the app.
                </p>
            </section>

            <section style={{ marginBottom: 32 }}>
                <h2 className="m-h2" style={{ marginBottom: 12 }}>How we use it</h2>
                <p>
                    Your data is used solely to operate the app for you: authenticating you, and
                    storing and displaying your tasks and entries back to you. We do not sell your
                    data, and we do not share it with third parties for advertising or marketing.
                </p>
            </section>

            <section style={{ marginBottom: 32 }}>
                <h2 className="m-h2" style={{ marginBottom: 12 }}>Where it&apos;s stored</h2>
                <p>
                    Data is stored in a MongoDB Atlas database and served through Vercel&apos;s hosting
                    infrastructure. Authentication with Google is handled directly by Google; we never
                    see or store your Google password.
                </p>
            </section>

            <section style={{ marginBottom: 32 }}>
                <h2 className="m-h2" style={{ marginBottom: 12 }}>Your data, your control</h2>
                <p>
                    You can edit or delete your tasks, categories, and entries at any time from within
                    the app. To request full account deletion, contact us using the email below.
                </p>
            </section>

            <section>
                <h2 className="m-h2" style={{ marginBottom: 12 }}>Contact</h2>
                <p>
                    Questions about this policy? Reach out at{' '}
                    <a href="mailto:adityapratapgoswami07@gmail.com" style={{ color: 'var(--m-accent)' }}>
                        adityapratapgoswami07@gmail.com
                    </a>
                    .
                </p>
            </section>
        </div>
    );
}
