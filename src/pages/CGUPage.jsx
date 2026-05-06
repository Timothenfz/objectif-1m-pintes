export default function CGUPage() {
  return (
    <div style={{ minHeight: '100dvh', paddingBottom: 100, background: 'var(--bg)' }}>
      <div style={{ padding: '52px 16px 20px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ fontFamily: 'Bebas Neue,sans-serif', fontSize: 28, color: 'var(--tx)' }}>MENTIONS LÉGALES</div>
        <div style={{ fontSize: 12, color: 'var(--tx2)', marginTop: 2 }}>& Éthique</div>
      </div>

      <div style={{ padding: '16px 16px 0', display: 'flex', flexDirection: 'column', gap: 16 }}>
        {[
          {
            icon: '🔞', title: 'Réservé aux majeurs',
            content: 'Cette application est exclusivement destinée aux personnes majeures (18 ans et plus). L\'accès et l\'utilisation de cette app par des mineurs est strictement interdit. En utilisant cette application, vous confirmez avoir l\'âge légal de consommer des boissons alcoolisées dans votre pays de résidence.',
          },
          {
            icon: '🎮', title: 'But de l\'application',
            content: 'Objectif 1 Million de Pintes est une application ludique et sociale destinée à des amis majeurs qui souhaitent partager leurs moments de convivialité. Elle n\'a aucun but commercial lié à la vente d\'alcool et ne fait pas la promotion de la consommation excessive.',
          },
          {
            icon: '⚖️', title: 'Conformité Loi Évin',
            content: 'Conformément à la loi Évin (loi n°91-32 du 10 janvier 1991), cette application ne constitue pas une publicité en faveur de boissons alcoolisées. Aucune marque, aucun produit alcoolisé n\'est mis en avant à des fins commerciales ou promotionnelles.',
          },
          {
            icon: '🚗', title: 'Alcool et conduite',
            content: 'La consommation d\'alcool est incompatible avec la conduite d\'un véhicule. Ne conduisez jamais après avoir consommé de l\'alcool. En France, le taux légal d\'alcoolémie est de 0,5g/L de sang (0,2g/L pour les conducteurs novices). Organisez toujours un retour sécurisé.',
          },
          {
            icon: '❤️', title: 'Consommation responsable',
            content: 'L\'alcool peut créer une dépendance. Si vous pensez avoir un problème avec l\'alcool, n\'hésitez pas à contacter Alcool Info Service au 0 980 980 930 (gratuit, 7j/7, 8h-2h). Cette application ne doit jamais être une incitation à consommer davantage.',
          },
          {
            icon: '🔒', title: 'Données personnelles',
            content: 'Les photos et données partagées dans l\'app sont visibles par tous les membres du groupe. Ne partagez pas de contenu inapproprié. Les données sont hébergées sur Supabase (Europe) et Vercel. Aucune donnée n\'est vendue à des tiers.',
          },
          {
            icon: '📋', title: 'Responsabilité',
            content: 'Les administrateurs de l\'application déclinent toute responsabilité quant aux comportements des utilisateurs en dehors de l\'application. L\'usage de cette app se fait sous l\'entière responsabilité de chaque utilisateur majeur.',
          },
        ].map((section, i) => (
          <div key={i} style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 14, padding: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <span style={{ fontSize: 22 }}>{section.icon}</span>
              <div style={{ fontFamily: 'Bebas Neue,sans-serif', fontSize: 18, color: 'var(--tx)', letterSpacing: '.03em' }}>{section.title}</div>
            </div>
            <div style={{ fontSize: 13, color: 'var(--tx2)', lineHeight: 1.7 }}>{section.content}</div>
          </div>
        ))}

        <div style={{ background: 'rgba(245,166,35,0.08)', border: '1px solid rgba(245,166,35,0.2)', borderRadius: 14, padding: '16px', textAlign: 'center' }}>
          <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--am)', marginBottom: 6 }}>Alcool Info Service</div>
          <div style={{ fontFamily: 'Bebas Neue,sans-serif', fontSize: 28, color: 'var(--tx)', letterSpacing: '.05em' }}>0 980 980 930</div>
          <div style={{ fontSize: 11, color: 'var(--tx2)', marginTop: 4 }}>Gratuit · 7j/7 · 8h-2h</div>
        </div>
      </div>
    </div>
  )
}
